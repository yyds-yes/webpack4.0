const dirJSON = require('./src/views/views.json');  //入口文件路径目录  约定每一个文件夹是一个入口
const path = require('path');  // node 的path模块
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isProd = (process.env.NODE_ENV === 'prod');

let entry = {};
let plugins = [];


// 循环地址信息
dirJSON.forEach(page => {
    entry[page.url] = path.resolve(__dirname, `./src/views/${page.url}/index.js`);//
    let chunks = [page.url];
    if (isProd) {
        chunks.splice(0, 0, 'assets');
        page.easyui && chunks.splice(0, 0, 'easyui');
        page.echarts && chunks.splice(0, 0, 'echarts');
        chunks.splice(0, 0, 'vendors');
    }
    plugins.push(
        new HtmlPlugin({
            favicon: path.resolve(__dirname, `./src/assets/img/favicon.ico`),
            filename: path.resolve(__dirname, `./dist/${page.url}.html`),//编译输出地址
            template: path.resolve(__dirname, `./src/views/${page.url}/index.html`),//引入模板地址
            chunks: chunks,
            chunksSortMode: 'manual',
            minify: isProd ? {
                collapseWhitespace: true,
                removeComments: true
            } : false
        })
    );
});

/**
 * 判断是否为prod 环境  使用contenthash来输出编译后的文件
 * @param  {Boolean} isProd [description]
 * @return {[type]}         [description]
 */
if (isProd) {
    plugins.push(//指定资源的输出路径
        new MiniCssExtractPlugin({
            filename: 'css/' + (isProd ? '[name].[contenthash:8].min.css' : '[name].css'),
            chunkFilename: 'css/' + (isProd ? '[name].chunk.[contenthash:8].min.css' : '[name].chunk.css'),
        })
    );
}


module.exports = {
    entry: entry,
    output: {//webpack 输出 文件   主要是js文件的输入路径  和文件名称
        publicPath: isProd ? './' : '',
        path: path.resolve(__dirname, './dist'),
        filename: 'js/' + (isProd ? '[name].[chunkhash:8].min.js' : '[name].js'),
        chunkFilename: 'js/' + (isProd ? '[name].chunk.[chunkhash:8].min.js' : '[name].chunk.js'),
    },
    module: {
        rules: [
            {
                test: require.resolve('jquery'),
                use: [{
                    loader: 'expose-loader',
                    options: 'jQuery'
                }, {
                    loader: 'expose-loader',
                    options: '$'
                }]
            },
            {
                test: /\.(html|htm)$/,
                use: ['html-withimg-loader']
            },
            {
                test: /\.(png|jpg|jpe?g|gif)$/,
                use: ['url-loader?limit=4096&name=[name]' + (isProd ? '.[hash:8]' : '') + '.[ext]&outputPath=img/', 'image-webpack-loader']
            },
            {
                test: /\.(webp)$/,
                use: ['file-loader?&name=[name]' + (isProd ? '.[hash:8]' : '') + '.[ext]&outputPath=img/']
            },
            {
                test: /\.(svg|woff|woff2|ttf|eot)(\?.*$|$)/,
                loader: 'file-loader?name=font/[name].[hash:8].[ext]'
            },
            {
                test: /\.(css)$/,
                use: [isProd ? ({
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        publicPath: '../'
                    }
                }) : 'style-loader', 'css-loader']
            },
            {
                test: /\.(scss)$/,
                use: [isProd ? ({
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        publicPath: '../'
                    }
                }) : 'style-loader', 'css-loader', {
                    loader: 'postcss-loader',
                    options: {
                        plugins: function () {
                            return [
                                require('autoprefixer')
                            ];
                        }
                    }
                }, 'sass-loader']
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                include: [path.resolve(__dirname, 'src/views'), path.resolve(__dirname, 'assets/js')], // 指定eslint检查的目录
                loader: 'eslint-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015-nostrict'],
                        plugins: ['transform-runtime']
                    }
                }
            }
        ]
    },
    plugins: [
        ...plugins
    ]
};
