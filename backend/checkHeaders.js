const http = require('http');

http.get('http://localhost:5000/api/auth/status', (res) => {
    console.log('Headers:', res.headers);
    if (res.headers['x-dns-prefetch-control']) {
        console.log('Helmet is active!');
    } else {
        console.log('Helmet might not be active.');
    }
    process.exit(0);
}).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
