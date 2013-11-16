var dateFormatter = function (row, cell, value, columnDef, dataContext) {
    var date = new Date(value)
    return date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
}