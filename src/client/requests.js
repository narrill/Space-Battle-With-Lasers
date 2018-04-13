module.exports = {
  getRequest(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      callback(JSON.parse(xhr.response));
    };
    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', "application/json");
    xhr.send();
  },

  postRequest(url, data, csrf, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.onload = () => {
      console.log(xhr.response);
      callback(xhr.status, JSON.parse(xhr.response));
    };
    xhr.setRequestHeader('CSRF-Token', csrf);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send(JSON.stringify(data));
  }
};