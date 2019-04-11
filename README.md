# window-messenger

## window windowMessenger.open(string url[, any data])

Open a window with data:

`a.html`
```javascript
windowMessenger.open('b.html', {
  foo: 'some data',
  bar: 'some data'
});
```

`b.html`
```javascript
windowMessenger.getInitialData()
  .then(console.log);
```

## function windowMessenger.subscribe([string channelName,] function callback)

Subscribe a channel:

```javascript
const unsubscribe = windowMessenger.subscribe('channel-name', (message) => {
  console.log(message);
  unsubscribe();
});
```

## windowMessenger.send(window target, any data[, string channelName])

Send message to a channel:
```javascript
  windowMessenger.send(window.opener, {
    foo: 'some data',
    bar: 'some data'
  }, 'my-channel');

  const win = windowMessenger.open('b.html', {
    foo: 'some data',
    bar: 'some data'
  });
  windowMessenger.send(win, {
    anotherFoo: 'new data',
    anotherBar: 'new data'
  });
```
