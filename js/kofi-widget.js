// Ko-fi floating chat button. Needs overlay-widget.js, which index.html loads just before this file.
if (typeof kofiWidgetOverlay !== 'undefined') {
  kofiWidgetOverlay.draw('dev_ohyt', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Tip Me',
    'floating-chat.donateButton.background-color': '#00b9fe',
    'floating-chat.donateButton.text-color': '#fff'
  });
}
