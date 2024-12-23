require('dotenv').config();

module.exports = {
    development: {
        username: 'balabi4359',
        password: 'Aliolkac4310*',
        database: 'movierec',
        host: '157.173.104.238',
        dialect: 'mysql',
    },
    production: {
        use_env_variable: 'DATABASE_URL',
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};
