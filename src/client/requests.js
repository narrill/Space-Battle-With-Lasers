module.exports = {
  getRequest(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      callback(JSON.parse(xhr.response));
    };
    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', "application/json");
    xhr.send();
    this.openRequests++;
  },

  postRequest(url, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.onload = () => {
      callback(xhr.status);
    };
    xhr.send(JSON.stringify(data));
  }
};