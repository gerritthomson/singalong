function mylog( logtext) {
//    document.getElementById("mylog").innerHTML += '<br>'+ logtext;
}
function myclearlog( ) {
    document.getElementById("mylog").innerHTML = '';
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            //      continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                var span = document.getElementById('showChart');
                span.innerHTML = "<PRE>" +  e.target.result + "</PRE>";
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsText(f);
    }
}
/*
console.log( typeof( window.requestFileSystem  ));
if (typeof(window.requestFileSystem) != 'function'){
    console.log( 'Using wqebkit name of filesystem');
    window.requestFileSystem = window.webkitRequestFileSystem;
}
*/

function errorHandler(e) {
    var msg = '';
    mylog("error" + e.code);
    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    };
    $('#mylog').html( 'Error: ' + msg);
    updateFileList();
}
function myinitFS() {
    mylog('attempting to get filesystem');
    window.requestFileSystem(window.TEMPORARY, 10*1024*1024, function(filesystem) {
        mylog('copy filesystem');
        fs = filesystem;
        if (! fs ){
            mylog('attempt failed');
            return;
        }
        updateFileList();
        mylog('attempt success');
    }, errorHandler);
}

function importing( fname){
    $('#status').text('Importing:' + fname );

}
function importComplete(){
    $('#status').text('complete');
}

function importToFilesystem(e){
    myclearlog();
    var files = e.target.files;
    // Duplicate each file the user selected to the app's fs.
    for (var i = 0, file; file = files[i]; ++i) {
        importing(file.name);
        // Capture current iteration's file in local scope for the getFile() callback.
        (function(f) {
            fs.root.getFile(f.name, {create: true, exclusive: true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.write(f); // Note: write() can take a File or Blob object.
                }, errorHandler);
            }, errorHandler);
            updateFileList();
        })(file);
    }
    importComplete();

}


function gt_copy(cwd, src, dest) {
    cwd.getFile(src, {}, function(fileEntry) {

        cwd.getDirectory(dest, {}, function(dirEntry) {
            fileEntry.copyTo(dirEntry);
        }, errorHandler);

    }, errorHandler);
}
function gt_move(src, dirName) {
    fs.root.getFile(src, {}, function(fileEntry) {

        fs.root.getDirectory(dirName, {}, function(dirEntry) {
            fileEntry.moveTo(dirEntry);
        }, errorHandler);

    }, errorHandler);
}
function gt_rename(cwd, src, newName) {
    cwd.getFile(src, {}, function(fileEntry) {
        fileEntry.moveTo(cwd, newName);
    }, errorHandler);
}
function showFile( src ){
    fs.root.getFile(src, {}, function(fileEntry) {
        fileEntry.file(function(file){
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function(theFile) {
                return function(e) {
                    mylog('reading');
                    // Render thumbnail.
                    var span = document.getElementById('showChart');
//                    span.innerHTML = "<PRE>" +  e.target.result + "</PRE>";
                    span.innerHTML = "<div contenteditable='false'>" +  toHtml(e.target.result) + "</div>";
                };
            })(file);
            mylog('about to read'+fileEntry.name);
            reader.readAsText(file);
            mylog('read');
        },errorHandler);
    }, errorHandler);
    updateFileList();
    currentFile = src;
}

function listResults(entries) {
    // Document fragments can improve performance since they're only appended
    // to the DOM once. Only one browser reflow occurs.
    var fragment = document.createDocumentFragment();

    for ( var x = 0; x < entries.length; x ++){
        var entry = entries[x];
        var img = entry.isDirectory ? '<img src="icon-folder.gif">' :
            '<img src="icon-file.gif">';
        var li = document.createElement('li');
        li.innerHTML = [img, '<span>', entry.name, '</span>'].join('');
        fragment.appendChild(li);
    }

    document.querySelector('#fileList').appendChild(fragment);
}
function updateFileList(){
    if (!fs) {
        return;
    }

    mylog( 'updating file list');
    var dirReader = fs.root.createReader();
    dirReader.readEntries(function(entries) {
        if (!entries.length) {
            mylog('no entries');
            fileList.innerHTML = 'Filesystem is empty.';
        } else {
            fileList.innerHTML = '';
            listResults(entries);
        }
    }, errorHandler);

}
function listener(e) {
    var l = document.createElement("li");
    mylog(e.type );
    switch(e.type) {
        case "animationstart":
        case "webkitAnimationStart":
            l.innerHTML = "Started: elapsed time is " + e.elapsedTime;
            $("#main").hide();
            $('#container').height('100%');
            $('#container').css('overflow','hidden');
            break;
        case "animationend":
        case "webkitAnimationEnd":
            l.innerHTML = "Ended: elapsed time is " + e.elapsedTime;
//            $("#main").show();
//            $('#container').height('50%');
//            $('#container').css('overflow','auto');
            break;
        case "animationiteration":
        case "webkitAnimationIteration":
            l.innerHTML = "New loop started at time " + e.elapsedTime;
            break;
    }
    document.getElementById("output").appendChild(l);
}

function setup() {
    var e = document.getElementById("showChart");
    e.addEventListener("animationstart", listener, false);
    e.addEventListener("animationend", listener, false);
    e.addEventListener("animationiteration", listener, false);
    e.addEventListener("webkitAnimationStart", listener, false);
    e.addEventListener("webkitAnimationEnd", listener, false);
    e.addEventListener("webkitAnimationIteration", listener, false);

}

function removeAll(){
    clearFS();
}

function clearFS() {
    fs.root.createReader().readEntries(function(results) {
        [].forEach.call(results, function(entry) {
            if (entry.isDirectory) {
                entry.removeRecursively(function() {}, errorHandler);
            } else {
                entry.remove(function() {}, errorHandler);
            }
        });
    }, errorHandler);

    // idb.drop(function(e) {
    //   logger.log('<p>Database deleted!</p>');
    // }, onError);
}


function toHtml( text ){
    if ( text.indexOf('<div') != -1 ){
        return text;
    }
    console.log( text );
    var asHtml = '';;
    lines = text.split("\n");
    for (var x = 0; x < lines.length; x ++){
        console.log( x);
      var a = lines[x];
        console.log( a );
        if ( hasChords( a )){
            a = a.replace(/ /g, '&nbsp;');
            asHtml += "<div class='chords'>"+a+"</div>";
            continue;
        }
        a = a.replace(/ /g, '&nbsp;');
        asHtml += "<div class='words'>" + a + "</div>";
    }
    return asHtml;
}

function hasChords( txt ){
    var words = txt.split(" ");
    var numShortWords = 0;
    for ( var x = 0; x < words.length; x ++){
        if ( words[x].length <= 2){
            numShortWords ++;
        }
    }
    if ( (words.length - numShortWords) < 5) {
        return true;
    }
    return false;
}
/*
$('body').on('focus', '[contenteditable]', function() {
    var $this = $(this);
    $this.data('before', $this.html());
    return $this;
}).on('blur keyup paste', '[contenteditable]', function() {
        var $this = $(this);
        if ($this.data('before') !== $this.html()) {
            $this.data('before', $this.html());
            $this.trigger('change');
        }
        return $this;
    });
*/

function makeEditable(){
    $("#showChart div").attr('contenteditable', true );
    $("#showChart").contentEditable().change(function(e){
        // what to do when the data has changed
        console.log(e);
//        $(".output .action").html(e.action);
//        for(i in e.changed){
//            $(".output .key").html(i);
//        }
        $('#save').show();
    });

}

function saveCurrentEdit(){
    fs.root.getFile(currentFile, {create: false}, function(fileEntry) {

        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function(fileWriter) {

            fileWriter.seek(0); // Start write position at EOF.

            // Create a new Blob and write it to log.txt.
            var blob = new Blob( [$('#showChart div').html()] , {type: 'text/html'});

            fileWriter.write(blob);

        }, errorHandler);

    }, errorHandler);

    $('#save').hide();


}