const { exec } = require('child_process');

exec('npx tailwindcss-cli@latest build -i ./wwwroot/css/tailwind.css -o ./wwwroot/css/tailwind-built.css --minify', (err, stdout, stderr) => {
    if (err) {
        console.error(`Error: ${err.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log(`Stdout: ${stdout}`);
});