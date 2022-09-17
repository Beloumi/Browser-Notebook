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
		if (element) {
			element.outerHTML = "";
		}
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
		if (! jsonContent) {
			return false;
		}
   	// check keys: iv, iter, ks, ts, mode, cipher, salt, ct
   	if ( jsonContent.hasOwnProperty('iv') && jsonContent.hasOwnProperty('iter')
  			&& jsonContent.hasOwnProperty('ks') && jsonContent.hasOwnProperty('ts')
  				&& jsonContent.hasOwnProperty('mode') && jsonContent.hasOwnProperty('cipher')
   			&& jsonContent.hasOwnProperty('salt') && jsonContent.hasOwnProperty('ct') ){
   		return true;
   	} else {
   		alert(lang.missing_required_json_key);//"JSON object does not contain required key");
   		return false;
   	}
	};

	/** Check and display a new file
	 * @param {String} [fileName] The file name
	 * @param {String} [fileContent] The file content
	 */
	var processNewFile = function (fileName, fileContent) {
		// check all localStorage items:
		if ( BrowserNotebook.checkForExistingStorageKey(fileName) == true){	
			// ask to overwrite:
			var r = confirm(lang.existing_title//"There is already a content named " 
			+ "\n" + BrowserNotebook.escapeString(fileName) + "\n" +
			lang.import_overwrites);//".\n Import will overwrite the existing content...");
			if (r == false) {	
				console.log("break file import...");
				// reload the page:
				window.location.reload();
				return;
			} 
		}
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
    	PswTitleAction.setTitle(fileName);
    	_storeImportedFile(fileContent);	
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
					url = URL.createObjectURL(file);				
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
    		//alert("Couldn't download the file " + PswTitleAction.getTitle() +":\n" + err);
    		PageView.errorDisplay(err, true, true, "Couldn't download the file " + BrowserNotebook.escapeString(PswTitleAction.getTitle()));
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
	
	/** Close the modal display of text, 
	 *	when close button was clicked
	 */
	var closeImportClipboardText = function () {

    	document.getElementById('importFromClipboardModal').style.display = "none";
	};  	
	
	/** Decrypt the imported text, 
	 *	
	 */
	var decryptClipboardText = function () {

		/* Get the ciphertext from the textarea */
    	var ciphertext = document.getElementById('importWorkaroundTextArea').value;
    	if ( ! ciphertext){
    		alert("No text");
    		return;
    	}
    	/* check if this is valid ciphertext */
 		if (FileAction.validateNotebookJSON(JSON.parse(ciphertext)) === false){
  			alert(lang.not_valid_json);
  			return;
  		}
  		/* Get the password from the password field */
    	var psw = document.getElementById('importWorkaroundPasswordField').value;  	
    	if ( ! psw){
    		alert("No password");
    		return;
    	}

    	// decrypt 
  		var plainText = sjcl.decryptWithScryptAndAES256(psw, ciphertext);
		var newText = EditorIntegration.getContent() + plainText;
	 	EditorIntegration.setContent(newText);

  		PageView.indicateUnsavedChanges(true);
  		
		//  storedSalt merken und ändern, dann zurücksetzen
	}; 
		
	/** Import an encrypted file, that was created with another browser, 
	 but with this application: 1. add a input dialog to get the file name, 
	 2. read the file, 3. decrypt and 4. display the plaintext
	 */
	var importFromClipboard = function (){
	
		var modalContent;
		var clipboradWorkaroundDiv;
		var closeButton;
		/* check if navigator is available */
		if (!navigator.clipboard) {
    		alert("Clipboard access not supported: ");
    		return;
  		}
  		
  		if (document.getElementById('formInputDiv').offsetParent === null){ // no password dialog is shown  		
  		
  			try {		
				// extra menu is not properly closed in some browsers:
				PageView.closeExtraMenu();
				modalContent = document.getElementById('importFromClipboardContent');	
				modalContent.textContent = ""; // clear all existing children
		
				clipboradWorkaroundDiv = document.createElement("div");
				clipboradWorkaroundDiv.setAttribute("id", 'importClipboardTextDiv');
				clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_1)	);
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
				clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_2)	);
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
				var workaroundTextarea = document.createElement("textarea");
				workaroundTextarea.setAttribute('id', "importWorkaroundTextArea");
				workaroundTextarea.rows = "10";
				workaroundTextarea.cols = "50";
				clipboradWorkaroundDiv.appendChild(workaroundTextarea);
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
				clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_3)	);
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));
			
				var workaroundPasswordField = document.createElement("input");
				workaroundPasswordField.setAttribute('type','password');
    			workaroundPasswordField.setAttribute('id','importWorkaroundPasswordField');
    			workaroundPasswordField.required = true;
    			clipboradWorkaroundDiv.appendChild(workaroundPasswordField);
   			clipboradWorkaroundDiv.appendChild(document.createElement("br"));
   			clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_4)	);
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));
				clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_5)	);
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));
				clipboradWorkaroundDiv.appendChild(document.createElement("br"));
				
				var decryptButton = document.createElement("button");
				decryptButton.className = "close";
				decryptButton.setAttribute('title','decrypt');
				decryptButton.appendChild(document.createTextNode(lang.decrypt) );    		
				clipboradWorkaroundDiv.appendChild(decryptButton);
				decryptButton.addEventListener("click",  function(){
					FileAction.decryptClipboardText(); });
				
				closeButton = document.createElement("button");
				closeButton.className = "close";
				closeButton.setAttribute('title','close');
				closeButton.appendChild(document.createTextNode(lang.close_ciphertext) );    		
				clipboradWorkaroundDiv.appendChild(closeButton);
				closeButton.addEventListener("click",  function(){
					FileAction.closeImportClipboardText(); });				
			
				modalContent.appendChild(clipboradWorkaroundDiv);

				document.getElementById('importFromClipboardModal').style.display = "block";
			
			}	catch (err) { // display encrypted text in alert...
				PageView.errorDisplay(err, false, true, "Getting encrypted text failed");
 				//alert(window.localStorage.getItem(BrowserNotebook.escapeString(PswTitleAction.getTitle())));
 			}  
 	
 		} else { // password dialog is shown
 
   		try {		
			// extra menu is not properly closed in some browsers:
			PageView.closeExtraMenu();

			modalContent = document.getElementById('importFromClipboardContent');	
		
			clipboradWorkaroundDiv = document.createElement("div");
			clipboradWorkaroundDiv.setAttribute("id", 'importClipboardTextDiv');
			// set height (differs if opened in decrypted mode)
			clipboradWorkaroundDiv.style.height = "8em";
			clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_hint)	);
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));
			clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.import_workaround_open_text)	);
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
			closeButton = document.createElement("button");
			closeButton.className = "close";
			closeButton.setAttribute('title','close');
			closeButton.appendChild(document.createTextNode(lang.close_ciphertext) );    		
			clipboradWorkaroundDiv.appendChild(closeButton);
			closeButton.addEventListener("click",  function(){
				FileAction.closeImportClipboardText(); });				
			
			modalContent.appendChild(clipboradWorkaroundDiv);

			document.getElementById('importFromClipboardModal').style.display = "block";

			
			}	catch (err) { // display encrypted text in alert...
				PageView.errorDisplay(err, false, true, "Getting encrypted text failed");
 				//alert(window.localStorage.getItem(BrowserNotebook.escapeString(PswTitleAction.getTitle())));
 			}  
 		}
	};	

  	return { // make functions public:
  		downloadFile: downloadFile,
  		importFile: importFile, 
  		importFromClipboard: importFromClipboard,
  		decryptClipboardText: decryptClipboardText,
  		closeImportClipboardText: closeImportClipboardText,
  		processNewFile: processNewFile,
  		readSingleFile: readSingleFile, 
  		validateNotebookJSON: validateNotebookJSON
  	};
})();
