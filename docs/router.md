# forte-conductor-router

#### server.js
``` node
app.get('/*', (req, res, next) => {
  // set network layer
  ConductorRouter.injectApi(api)
  
  match({routes, location: req.originalUrl}, (error, redirectLocation, renderProps) => {
    if (error) {
      next(error);
    } else if (redirectLocation) {
      ...
    } else if (renderProps) {
      ConductorRouter.prepareData(renderProps).then(render, next);
    } else {
      res.status(404).send('Not Found');
    }

    function render(data) {
      const reactOutput = ReactDOMServer.renderToString(
        <ConductorRouter.RouterContext {...renderProps} />
      );

      res.render(path.resolve(__dirname, '..', 'views', 'index.ejs'), {
        conductorData: JSON.stringify(data),
        reactOutput
      });
    }
  });
});

```

#### client.js
``` node
ReactDOM.render(
    <ConductorRouter.Router routes={routes} history={browserHistory} />,
    rootElement
);
```