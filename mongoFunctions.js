var insertDocument = function(db, data, callback) {
    db.collection('annotations').insertOne({
        "user": data.user,
        "document": data.document,
        "line": data.line,
        "note": data.note
    }, function(err, result) {
        assert.equal(err, null);
        console.log("Inserted a document into the annotations collection.");
        callback(result);
    });
};

var getUserNotes = function(db, data, callback) {

};

var getAllNotes = function(db, data, callback) {

};

exports.insertDocument = insertDocument;
exports.getUserNotes = getUserNotes;
exports.getAllNotes = getAllNotes;