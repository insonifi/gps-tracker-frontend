var dateFormatter = function (row, cell, value, columnDef, dataContext) {
    var date = new Date(value)
    return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}