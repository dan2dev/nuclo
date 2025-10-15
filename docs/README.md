# nuclo Documentation

This directory contains the documentation website for nuclo, hosted on GitHub Pages.

## Site Structure

- `index.html` - Home page with overview and features
- `getting-started.html` - Installation and setup guide
- `api.html` - Complete API reference
- `examples.html` - Real-world code examples
- `assets/` - Stylesheets, JavaScript, and images
  - `css/style.css` - Main stylesheet
  - `js/main.js` - Interactive features

## Viewing Locally

To view the documentation locally, you can use any static file server. For example:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## GitHub Pages

This documentation is automatically deployed to GitHub Pages from the `/docs` directory.

The site is available at: https://dan2dev.github.io/nuclo/

## Building

No build step is required. The documentation is plain HTML, CSS, and JavaScript that runs directly in the browser.

## Contributing

To contribute to the documentation:

1. Edit the HTML files in this directory
2. Test locally using a static server
3. Submit a pull request

Please ensure:
- All links work correctly
- Code examples are tested and functional
- The responsive design works on mobile devices
- Accessibility guidelines are followed

## License

MIT License - see the root LICENSE.md file for details.
