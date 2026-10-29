// Google Analytics setup. Loaded as a classic script after the gtag.js tags in index.html.
// Measurement IDs are kept as they were; which property should stay is an open decision (see todo.md).

// GA4
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-82VT64DNNE', {
  'anonymize_ip': true,
  'allow_google_signals': true
});

// Google tag (second property)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-YVXKB946XE');
