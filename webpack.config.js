module.exports = {
    entry: "./src/index.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
      loaders: [
        {
          test: /.jsx?$/,
          loader: 'babel-loader',
          exclude: /node_modules|lib|three.js-master/,
          query: {
            presets: ['es2015', 'react']
          }
        }
      ]
    }
};
