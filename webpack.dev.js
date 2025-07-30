const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    mode: "development",
    entry: "./demo/index.tsx",
    output: {
        path: path.resolve(__dirname, "dist-demo"),
        filename: "bundle.js",
        clean: true,
    },
    devtool: "source-map",
    devServer: {
        static: "./dist-demo",
        port: 3000,
        hot: true,
        historyApiFallback: true,
        open: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.(tsx|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        plugins: [
                            require.resolve('react-refresh/babel'),
                        ]
                    },
                },
            },
            {
                test: /\.js$/,
                // use: 'raw-loader',
                type: 'asset/source',
                resourceQuery: /raw/,
                //include: path.resolve(__dirname, 'src')
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ],
                exclude: /node_modules/,
            }
        ],
    },
    plugins: [
        new ReactRefreshWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: "./demo/index.html",
        }),
    ],
};
