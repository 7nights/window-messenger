const windowMessenger = {
  open(url, data, channel = '_initialData_') {
    const win = window.open(url, '_blank');
    initWindow(win, data, channel);

    return win;
  },
  send(target, data, channel) {
    let windowData = windows.get(target);
    if (!windowData) {
      windowData = { loaded: true };
    }
    if (windowData.loaded) {
      target.postMessage({
        data,
        channel,
        __fromWindowMessenger: true
      });
    } else {
      windowData.pendingMessages.push({
        data, channel
      });
    }
  },
  subscribe(channel, callback) {
    if (arguments.length === 1) {
      callback = channel;
      channel = '_';
    }
    if (!listeners[channel]) {
      listeners[channel] = new Map();
    }
    const sb = Symbol();
    listeners[channel].set(sb, {
      channel, callback
    });

    // check if we have unconsumed messages
    unconsumedMessages = unconsumedMessages.filter(msg => {
      if (msg.channel === channel) {
        Promise.resolve(msg)
          .then(callback);
        return false;
      }
      return true
    });

    // unsubscribe
    return () => {
      listeners[channel].delete(sb);
    };
  },
  getInitialData() {
    return new Promise((resolve) => {
      if (windowMessenger.initialData) {
        resolve(windowMessenger.initialData);
      } else {
        windowMessenger.__initialDataResolver = resolve;
      }
    });
  }
};

// Grouped by channel.
// default channel is '_'.
const listeners = {};
const windows = new WeakMap();
let unconsumedMessages = [];
window.addEventListener('message', (ev) => {
  let windowData = windows.get(ev.source);
  if (!windowData) {
    windowData = {
      loaded: true
    };
  }
  if (!windowData.loaded) {
    windowData.loaded = true;
  }
  // send pending messages
  if (windowData.pendingMessages && windowData.pendingMessages.length > 0) {
    windowData.pendingMessages.forEach(val => windowMessenger.send(ev.source, val.data, val.channel));
  }
  windowData.pendingMessages = [];

  if (ev.data && ev.data.channel === '__loaded') {
    return;
  }
  if (!ev.data || !ev.data.__fromWindowMessenger) {
    return;
  }

  // send messages to subscribers

  const { channel = '_', data } = ev.data;
  const _listeners = Array.from((listeners[channel] && listeners[channel].values()) || []).concat(Array.from((listeners['*'] && listeners['*'].values()) || []));

  // we ensure every message is consumed
  if (_listeners.length === 0) {
    unconsumedMessages.push(ev.data);
  }

  _listeners.forEach(({ callback }) => {
    try {
      typeof callback === 'function' && callback(data, channel);
    } catch (ex) {
      console.error(ex);
    }
  });
});
function initWindow(win, data, channel) {
  const pendingMessages = [];
  data && pendingMessages.push({
    data, channel
  });
  windows.set(win, {
    pendingMessages
  });
}
windowMessenger.subscribe('_initialData_', (data) => {
  windowMessenger.initialData = data;
  windowMessenger.__initialDataResolver && windowMessenger.__initialDataResolver(data);
});
// send load message to parent
window.opener && windowMessenger.send(window.opener, {}, '__loaded');

export default windowMessenger;
