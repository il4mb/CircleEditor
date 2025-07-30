const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./demo/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist-demo"),
    filename: "bundle.js",
  },
  devtool: "source-map",
  devServer: {
    static: "./dist-demo",
    port: 3000,
    hot: true,
    open: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "babel-loader",
        exclude: /node_modules/,
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./demo/index.html",
    }),
  ],
};
