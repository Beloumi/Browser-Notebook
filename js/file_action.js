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
var FileAction = (function () {

	//========================= PRIVATE FUNCTIONS ================================================
	
	/** Store item
	Called from onload function:
	Store the json file as encrypted text, remove file input, 
	display password field 
	@param {String} [fileContent] The content of the file as JSON string
	* private function	
	*/
	var _storeImportedFile = function (fileContent) {

		// Store: this is already a JSON object
		window.localStorage.setItem(PswTitleAction.getTitle(), fileContent);
		// remove input div
		var element = document.getElementById("importDiv");
		element.outerHTML = "";
		//delete element;
			
		// display password field:
		PageView.showInputForm(false, true, false);
	};

	//========================= PUBLIC FUNCTIONS ================================================
	
	/** Check key value pairs for Browser Notebook texts
	 * @param {Object} [jsonContent] The content of the file as JSON object
	 * @return true, if the object contains all required Browser Notebook keys
	 */
	var validateNotebookJSON = function (jsonContent){
   	// check keys: iv, iter, ks, ts, mode, cipher, salt, ct
   	if (jsonContent.hasOwnProperty('iv') && jsonContent.hasOwnProperty('iter')
   			&& jsonContent.hasOwnProperty('ks') && jsonContent.hasOwnProperty('ts')
  				&& jsonContent.hasOwnProperty('mode') && jsonContent.hasOwnProperty('cipher')
   			&& jsonContent.hasOwnProperty('salt') && jsonContent.hasOwnProperty('ct')){
   		return true;
   	} else {
   		alert(lang.missing_required_json_key);//"JSON object does not contain required key");
   		return false;
   	}
	};

	/** Read a file from file input: FileReader and onload function
	 * @param {Object} [e] The event
	 */
	var readSingleFile = function (e) {
 		var file = e.target.files[0];
  		if (!file) {
    		return;
  		}
  		// remove extension: .json or other
  		var fileNameCheck = file.name.substring(0, file.name.lastIndexOf('.'));
  		// check if there is already an item for this key:
		// check all localStorage items:
		if ( BrowserNotebook.checkForExistingStorageKey(fileNameCheck)	== true){	
			// ask to overwrite:
			var r = confirm(lang.existing_title//"There is already a content named " 
			+ "\n" + fileNameCheck + "\n" +
			lang.import_overwrites);//".\n Import will overwrite the existing content...");
			if (r == false) {	
				console.log("break file import...");
				// reload the page:
				window.location.reload();
				return;
			} 
		}
		PswTitleAction.setTitle(fileNameCheck);
  
  		var reader = new FileReader();
  		reader.onload = function(e) {
    		var fileContent = e.target.result;
    		// check validity of JSON:
			var jsonContent; // JSON object
			try {
   			jsonContent= JSON.parse(fileContent);
  			} catch (e) {
  				alert(lang.not_valid_json);//"File content is not valid JSON format...");
      		return;
  			}
    		if ( validateNotebookJSON(jsonContent) === false) {
    			alert(lang.invalid_notebook_file //"Invalid file for Browser Notebook: "
    			 + file.name);
    			return;
    		}
    		// store encrypted content
    		PswTitleAction.setTitle(fileNameCheck);
    		_storeImportedFile(fileContent);
  		};
  		reader.readAsText(file);
	};

	/** Download the current content encrypted as JSON file
	*/
	var downloadFile = function (){
	
		if (document.getElementById("passwordDiv").offsetParent !== null){
			alert(lang.first_enter_password);//"You must first enter the password...");
			return;
		}	
		// close extra menu:
		PageView.closeExtraMenu();
		try {
			// encrypt current content and save
			var encryptedText = BrowserNotebook.encryptAndSaveByStoredKey();
			
    		//var file = new Blob([encryptedText], {type: "text/plain"});
    		var file = new Blob([encryptedText], {type: "application/json"});
    	
    		if 	(window.navigator.msSaveOrOpenBlob) {// IE10+, Edge
        		window.navigator.msSaveOrOpenBlob(file, PswTitleAction.getTitle() + ".json");
    		} else { // Others
        		var aLink = document.createElement("a");
				var url;
				if ( window.URL && window.URL.createObjectURL ) {
					var url = URL.createObjectURL(file);				
				} else if ( window.webkitURL ) {
					url = window.webkitURL.createObjectURL( file );
				} else { //Opera
					alert(lang.no_support_download);//"Your browser does not support this download function");
					// must return, Opera could not load page otherwise
					return;
				}

       		aLink.href = url;
        		aLink.download = PswTitleAction.getTitle() + ".json";// exportFilename;
        		document.body.appendChild(aLink);
        		aLink.click();
        		setTimeout(function() {
            	document.body.removeChild(aLink);
            	window.URL.revokeObjectURL(url);  
        		}, 0); 
    		}
    		console.log("encrypted text exported in file " + PswTitleAction.getTitle() + ".json");
    	} catch (err) {
    			alert("Couldn't download the file " + PswTitleAction.getTitle() +":\n" + err);
    	}
	};
	/** Import an encrypted file, that was created with another browser, 
	 but with this application: 1. add a input dialog to get the file name, 
	 2. read the file, 3. decrypt and 4. display the plaintext
	 */
	var importFile = function (){
	
		// Check for File API support.
		if (! (window.File && window.FileReader)) {
  			alert(lang.no_support_upload);//'Your browser does not support file upload...');
  			return;
  			// TODO HTTPRequest
		} 	
		// close extra menu:
		PageView.closeExtraMenu();
		PageView.fileImportInput();
	};

  
  	return { // make functions public:
  		downloadFile: downloadFile,
  		importFile: importFile, 
  		readSingleFile: readSingleFile, 
  		validateNotebookJSON: validateNotebookJSON
  	};
})();
