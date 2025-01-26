
// src/server.ts
import App from './app';
import logger from './utils/logger.utils';

process.on('exit', (code) => {
    logger.info(`Process exiting with code: ${code}`);
});

try {
    const server = new App();
    server.start();
} catch (error) {
    logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : error
    });
    process.exit(1);
}