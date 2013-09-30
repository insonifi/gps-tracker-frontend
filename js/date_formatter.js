var dateFormatter = function (row, cell, value, columnDef, dataContext) {
    return (new Date(value)).toTimeString().slice(0,8)
}