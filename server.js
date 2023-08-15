const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
const dotenv = require('dotenv');
const app = require('./app.js');
dotenv.config({ path: './config.env' });

///server 
// console.log(app.get('env'))//development 
// console.log(process.env)//development 
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('db Connection successfull');
        app.listen(port, () => {
            console.log(`running on ${port}`);
        });
    }
    ).catch((err) => {
        console.log('db Connection failed\n', err);
    });



process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('unhandelled rejection shutting down');
    server.close(() => {
        process.exit(1);
    }
    );
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception! Shutting down...');
    console.error(err.name, err.message);

    // Gracefully shut down the application, cleanup, and exit
    process.exit(1);
});

