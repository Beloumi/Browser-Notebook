/**
	 © 2018 Axel von dem Bruch

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";
var CloudAction = (function () {
	
	var dropboxLoaded = false;
	
	//========================= PUBLIC FUNCTIONS ================================================
	
	
	/** Load the Dropbox library only if needed,
	 *  because dropins.js accesses some user info. 
	*/
	var loadDropboxLib = function () {
		var script = document.createElement("script");
		script.setAttribute("type", "text/javascript");
		script.setAttribute("src", "https://www.dropbox.com/static/api/2/dropins.js");
		script.setAttribute("id", "dropboxjs");	
		script.setAttribute("data-app-key", "nlkvxuae166zuzw");
		
		script.addEventListener('load', function() {		  	
		  // hide the enanble button
		  	document.getElementById("enableDropbox").style.display = "none";
		  	document.getElementById("dropboxTrackerHint").style.display = "none";
		  	// show load and save buttons
			document.getElementById("dropboxButton").style.display = "block";
			document.getElementById("dropboxButtonSave").style.display = "block";			  	
    		//alert("loaded");
  		});	
		document.getElementsByTagName("head")[0].appendChild(script);
		dropboxLoaded = true;
	};

	/** Save the current file to Dropbox
	*/
	var dropboxSave = function() {
		
		if (dropboxLoaded == false){
			alert("You have to enable Dropbox");
			return;
		}
		
		if (! Dropbox.isBrowserSupported() ){
			alert("Dropbox: " + lang.no_support_upload );//("Error: Your browser does not support Dropbox Chooser...");
			return;
		}	
		// get content:
		var encryptedText = BrowserNotebook.encryptAndSaveByStoredKey();
		if (! encryptedText || encryptedText.length === 0 ){
			// there is already an alert from encryptAndSaveByStoredKey
			return;
		}
		// create helper element to get a file object for Dropbox (Blob does not work)
		var helperElement = document.createElement('a');		
  		helperElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(encryptedText));
  		helperElement.style.display = 'none';
  		var fileUrl = helperElement.href;

  		var options = { 
  			files: [
        		{'url': fileUrl, 'filename': PswTitleAction.getTitle() + ".json"}
    		],

    		// Success is called once all files have been successfully added to the user's
    		// Dropbox, although they may not have synced to the user's devices yet.
    		success: function () {
        		// Indicate to the user that the files have been saved.
        		alert( lang.file_saved + "\n" + PswTitleAction.getTitle() + ".json");
    		},

    		// Progress is called periodically to update the application on the progress
    		// of the user's downloads. The value passed to this callback is a float
    		// between 0 and 1. The progress callback is guaranteed to be called at least
    		// once with the value 1.
 //   		progress: function (progress) {
//				console.log("progress: " + progress);    		
 //   		}, 

    		// Cancel is called if the user presses the Cancel button or closes the Saver.
    		cancel: function () {
    			console.trace();
    			console.log("Save file to dropbox canceled ");    
    		},

    		// Error is called in the event of an unexpected response from the server
   		 // hosting the files, such as not being able to find a file. This callback is
    		// also called if there is an error on Dropbox or if the user is over quota.
    		error: function (errorMessage) {
   			if (errorMessage =! null) {
   				 alert("Dropbox couldn't save the file " + PswTitleAction.getTitle() + ".json");
   				 console.log("Error: " + error);   				 	
   			}    
    		}
		};
		Dropbox.save(fileUrl, PswTitleAction.getTitle() + ".json", options);		
	};	
	
	/** Load the list of json files from Dropbox
	*/
	var dropboxLoad = function() {

		if (dropboxLoaded == false){
			alert("You have to enable Dropbox");
			return;
		}
		
		if (! Dropbox.isBrowserSupported() ){
			alert("Dropbox: " + lang.no_support_download);//"\nYour browser does not support Dropbox Chooser...");
			return;
		}		

		// Create the options parameter
		var options = {
    		// Required. Called when a user selects an item in the Chooser.
    		success: function(files) {
    			// there is always only one file
				var file = files[0];    		
    			if (!fetch ) {
    				alert("Dropbox " + lang.no_support_download);
    			}      		
         		fetch(file.link) // Call the fetch function passing the url of the API as a parameter
					.then(function(response) {
  						return response.text();
					})
					.then(function(text) {
						// remove extension: .json or other
  						var fileName = file.name.substring(0, file.name.lastIndexOf('.'));						
  						if ( BrowserNotebook.checkForExistingStorageKey(fileName)	== true){	
								// ask to overwrite:
								var r = confirm(lang.existing_title//"There is already a content named " 
								+ "\n" + fileName + "\n" +
								lang.import_overwrites + "\n...");//".\n Import will overwrite the existing content...");
								if (r == false) {	// do not overwrite: reload
									console.log("break file import...");
									// reload the page:
									window.location.reload();
									return;
								} else { // overwrite: remove existing item
									window.localStorage.removeItem(fileName);
								}
						} 		
						// set the title
						PswTitleAction.setTitle(fileName);
						// quit current text if open
						// check if password field is shown
						if ( document.getElementById("passwordDiv").offsetParent === null){
							BrowserNotebook.quitProgram();
							// set last opened text title: 
 							window.localStorage.setItem( 'lastTitle', fileName);
 						}					
						// remove titles from list
						if (document.getElementById("titleListDiv") != null
  								&& document.getElementById("titleListDiv").style.display === "block"){
  							var listNode = document.getElementById("titleListDiv");
							while (listNode.firstChild != null) {
    							listNode.removeChild(listNode.firstChild);
							}		
						}
						// hide title list:
						document.getElementById("titleListDiv").style.display = "none";	
						// add new text title		
		 				document.getElementById("currentTitleDiv").textContent = "";
		 				var titleSpan = document.createElement('span');
		 				titleSpan.setAttribute("id", "currentTitleSpan");
		 				titleSpan.appendChild(document.createTextNode(BrowserNotebook.escapeString(fileName)));
		 				document.getElementById("currentTitleDiv").appendChild(titleSpan);		 						 	
						// check and load the file
  						FileAction.processNewFile(fileName, text);
					})
					.catch(function(error) {
   				 //cloud action error: TypeError: element is null
   				 if (error =! null){
   				 	console.log("cloud action error (load file from Dropbox): " + error); 
   				 	// quit the program: show start dialog
   				 	BrowserNotebook.quitProgram();
   				 	//alert("Couldn't load a file from Dropbox" );  				 	
   				 }
					}
				);
    		},

   		 // Optional. Called when the user closes the dialog without selecting a file
    		cancel: function() {
    			console.trace();
    			console.log("Import file from dropbox canceled ")
    		},

    		// Optional. "preview" (default) is a preview link to the document for sharing,
    		// "direct" is an expiring link to download the contents of the file. 
    		linkType: "direct", // "preview" or "direct"

    		// Optional. A value of false (default) limits selection to a single file, while
   	 	// true enables multiple file selection.
   		 multiselect: false, // or true

    		// Optional. This is a list of file extensions. 
    		extensions: ['.json', '.JSON'],//, '.docx'],

    		// Optional. A value of false (default) limits selection to files,
   	 	// while true allows the user to select both folders and files.
    		folderselect: false, // or true
		};		
		//console.log("options: " + options.extensions.toString());
	
		// trigger the Chooser
		Dropbox.choose(options);
	};

  
  	return { // make functions public:
  		loadDropboxLib: loadDropboxLib,
  		dropboxLoad: dropboxLoad,
  		dropboxSave: dropboxSave
  	};
})();
