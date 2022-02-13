module.exports = function (api) {
    //api.cache(true);
    api.cache.using(() => process.env.NODE_ENV);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['inline-dotenv']
    };
};
