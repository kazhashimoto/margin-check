function save_options() {
  let obj = {
    items: {},
    colors: {},
  };
  document.querySelectorAll('.item').forEach(e => {
    obj.items[e.id] = (e.type == 'checkbox')? e.checked: e.value;
  });
  document.querySelectorAll('.color').forEach(e => {
    obj.colors[e.id] = e.value;
  });
  chrome.storage.sync.set({options: obj}, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = '設定を保存しました。';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get('options', function(result) {
    if ('options' in result) {
      const options = result.options;
      document.querySelectorAll('.item').forEach(e => {
        const opt_value = options.items[e.id];
        if (e.type == 'checkbox') {
          e.checked = opt_value;
        } else {
          e.value = opt_value;
        }
      });
      document.querySelectorAll('.color').forEach(e => {
        e.value = options.colors[e.id];
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
