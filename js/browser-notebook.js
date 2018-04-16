/**
	 © 2017, 2018 Axel von dem Bruch

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
var BrowserNotebook = (function () {
	
	// mode of operation: true = alert errors
	var testMode = true;
	
	// running on a local site, no web
	var localSite = false;

	// is android, IE, Edge or not:
	var isAndroid = false;
	var isIE = false;
	var isEdge = false;

	var workFactor = 16384;// * 2;

	// the version of Browser Notebook: is set as adata in JSON object
	var version = '0.5';
	// Name of the program: is set as adata
	var programName = "Browser Notebook ";
	

	/** Close the modal dialog to display the encrypted text
	 *  if click or touch outside of dialog text
	 */
	var _closeOpenMenuAndDialogs = function(event) {
//		console.log("tagName: " + event.target.tagName + ", target: " + event.target.id);
    	if (event.target === document.getElementById('encryptedTextModal')) { // outside the encrypted text
    		// close encrypted text:
    		PageView.closeEncryptedText();
    	}
 /*   	if (event.target.tagName !== 'A') {
    		// close all menu items:
    		console.log("not a");
    	}*/
	};


	/** Convert 4 byte word into byte array
 	*/
	var wordToByteArray = function (word, length) {
		var byteArray = [], i, xFF = 0xFF;
		if (length > 0)
			byteArray.push(word >>> 24);
		if (length > 1)
			byteArray.push((word >>> 16) & xFF);
		if (length > 2)
			byteArray.push((word >>> 8) & xFF);
		if (length > 3)
			byteArray.push(word & xFF);
		return byteArray;
	};


	/** Init: check if storage is supported, if text is already stored, 
	 *  do some settings
	*/
	var init = function (evt){	
	
		// global error handling
		window.onerror = function(msg, src, line, col, error) {
   		var extra = !msg ? '' : '\n' + msg;
   		extra += !src ? '' : '\n' + src;
   		extra += !line ? '' : '   ' + line;
   		extra += !col ? '' : ', ' + col;
   		if (error) {
   			extra += '\n ' + error + ": ";
   			extra += !error.fileName ? '' : '\n' + error.fileName;
   			extra += !error.lineNumber ? '' : ': ' + error.lineNumber;
   		}
   		alert(lang.unexpected_error + extra);
   		//return true;
		};	

		// check if storage is supported
		if (typeof(Storage) === "undefined") {
			alert("Your browser does not support local storage.\n"
			+ " The reason is probably that your browser is outdated\n"
			+ " or local storage is disabled in your browser settings...");
			// remove password field and textArea
			var element = document.getElementById("passwordDiv");
			element.outerHTML = "";
			//delete element;
			element = document.getElementById("textDiv");
			element.outerHTML = "";
			//delete element;		
		} else {
			console.log("local storage available");
			// check for Internet Explorer 6-11 or Edge + locale HTML file
			//isIE = /*@cc_on!@*/false || !!document.documentMode;// IE
			isIE = /MSIE 10/i.test(navigator.userAgent);
			isEdge = window.navigator.userAgent.indexOf("Edge") > -1; // Edge
			localSite = ("file:".match(window.location.protocol));
			//console.log("local: " + localSite + ", ie: " + isIE + ", Egde: " + isEdge);
			if ((localSite) // local HTML
				&& ((isIE === true) || (isEdge === true))){
				alert("Internet Explorer and Edge do not support local storage for non-server (offline) sites...");
			}		
		}
	
		// always use https if not local site:
		if ( (localSite === false) && (location.protocol != 'https:')) {
 			location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
		} 
		if ((localSite === false) && (location.protocol != 'https:')) { // set location failed...
			alert("Warning: You are using HTTP protocol.\n"
				+ "Your communication is not protected..." );
		}
  	
  		try { // Check for Opera
			window.localStorage;  	
 	 	} catch (err) {
  			if (err instanceof DOMException){
  			alert("To use this site in your current browser,\n"
  				+" you must enable third party cookies\n"
  				+ "(although this site does not use them)\n"
  				+ "or use Firefox to avoid the problem.");
				console.log("Enable third party cookies in your browser");	
  			} else {
  				PageView.errorDisplay(err, true, true, "local storage not available");
  			}
 	 	}
 	 	
 	 	// Check if touch is supported (iOS), otherwise click:
		let touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click';
		window.addEventListener(touchEvent, _closeOpenMenuAndDialogs);
	
		// load all valid existing titles:
		PageView.loadTitles();
	
		var numberOfTitles = PageView.getNumberOfTitles();
 	 	if ((window.localStorage.length === 0) // TODO Opera DOMEXception: third party cookies must be enabled
  		  		|| (window.localStorage.length == null) 
  	 	 		|| (numberOfTitles === 0) ){ // null and undefined/
  	 	 	PageView.showInputForm(true, true, true);
			// hide title list
			document.getElementById("titleListDiv").style.display = "none";

  		} else { // there is previously encrypted text in local storage
  			PageView.showInputForm(false, true, false);
  		}
		
		EditorIntegration.setEditor();
		// do not allow to type text before password is processed: 
		EditorIntegration.disableEditor();
	   EditorIntegration.doInitialSettings();
	
		// detect operating system Android:
		if (/android/i.test(window.navigator.userAgent)) {
 	       isAndroid = true;
 	  	} 
		// display the text titles: 
		if (numberOfTitles > 0){
	   	PageView.showTitleList();
	   }
	};


/***************** Converter and helper functions **************************************/

	/** Checks if there is already a key of localStorage. 
	 *  This must not be a Browser Notebook text. 
	*/
	var checkForExistingStorageKey = function (newKey){
		// check all localStorage items:
		var len = window.localStorage.length;
		for ( var i = 0; i < len; i++ ) {
			// TEST: ALL ITEMS
			//console.log("stored item: " + localStorage.key(i) + ", fileName: " + fileNameCheck);
			if (newKey === localStorage.key(i)) {
				return true;
			}
		}  
		return false;
	};


	/** Scenario: Encrypt content by key, save button clicked
	 * @return ciphertext (used for export)
	 */
	var encryptAndSaveByStoredKey = function () {
	
		//var plainText = document.getElementById("textField").value;
		var plainText = EditorIntegration.getContent();
		var encryptedText;
		if (! plainText ) {
			alert(lang.no_text);//"There is no text");
			return;
		} else {
			// encrypt the text
			//var errorString = "";
			try {			
				var rpStr = '{ "adata" : "' + programName + version + '" }'; 
				var rp = JSON.parse(rpStr);
				var encryptedText = sjcl.encryptWithScryptAndAES256(null, plainText, false, rp);// use stored key

				// Store: this is already a JSON object
				window.localStorage.setItem(PswTitleAction.getTitle(), encryptedText);
				console.log("Encrypted text stored");
				//console.log(encryptedText);  			
  			
  				// show that text is saved:
  				PageView.indicateUnsavedChanges(false);
			} catch (err) {		
				if (err.name.toUpperCase().includes("QUOTA") ) {
			/*	if ( (err.name === "QUOTA_EXCEEDED_ERR") // Safari
				|| (err.name === "NS_ERROR_DOM_QUOTA_REACHED") // Firefox
				|| (err.name === "QuotaExceededError") // Chrome
				|| (err.name === "W3CException_DOM_QUOTA_EXCEEDED_ERR")) { // IE*/
					alert(lang.memory_limit_exceeded);
					PageView.errorDisplay(err, false, true, "Saving and encryption failed...");
				} else {
					PageView.errorDisplay(err, true, true, "Saving and encryption failed...");	
				}
			}
		}		
/*		// set href of dropbox link:
    	var file = new Blob([encryptedText], {type: "application/json"});
    	file.lastModifiedDate = new Date();
    	file.name = PswTitleAction.getTitle() + ".json";
    	var fileUrl;
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
			fileUrl = url;
		}
		// set the link href:
		document.getElementById("contentLink").href= fileUrl; 				
*/		
		return encryptedText;	
	};


/***************** Button functions **************************************/

	/** Save the current text, clear text area and quit
	*/
	var quitProgram = function (){	
		if (PageView.isUnsavedChanges() === true){	
			var r = confirm(lang.unsaved_changes);//"There a unsaved changes..\n Do you want to save?");
				if (r == true) {
					try{
						encryptAndSaveByStoredKey();
					} catch (err) {
						PageView.errorDisplay(err, true, true, "Encryption failed...");	
						//throw new Error(err);
					}	
				}
		} 
		//document.getElementById("textField").value = "";
		EditorIntegration.setContent("");
		window.location.reload();
	};


	/** Delete current local storage item
	*/
	var clearStorage = function (){
		// check if password field is shown
		if ( document.getElementById("passwordDiv").offsetParent !== null){
			alert(lang.first_enter_password);//"You must first enter the password...");
			return;
		}
	
		var r = confirm(lang.text_lost);//"If you continue, the current text will be lost.");
		if (r == true) {
   	 	window.localStorage.setItem(PswTitleAction.getTitle(), "");
   	 	window.localStorage.removeItem(PswTitleAction.getTitle());
			//document.getElementById("textField").value = "";
			EditorIntegration.setContent("");
			window.location.reload(); 
		} else {
   	 	return;
		} 
	};

	/** Create a new text with title and password
	*/
	var newText = function () {
		// remove old text content:
		//document.getElementById("textField").value = "";
		EditorIntegration.setContent("");
		PageView.showInputForm(true, true, true);
	};
	/** Get the Scrypt work factor
	 * @return the work factor as number
	*/
	var getWorkFactor = function() {
		return workFactor;
	};
	
	var isTestMode = function() {
		return testMode;
	};

	/** Set the work factor N of Scrypt key derivation: 
	 *  For existing texts the
	 *  password must be typed and confirmed
	*/
	var setWorkFactor = function (event, newWorkFactor) {

		// set iteration in modified_convenience.js
		workFactor = newWorkFactor;	
		// show new selected value in menu:
		// set current work factor background and reset other links
		// get all li elements of parent of parent of target (a element in li in ul)
		var listArray = event.target.parentElement.parentElement.getElementsByTagName("li");
		for (var i = 0; i < listArray.length; i++) {
			if (event.target.isEqualNode(listArray[i].firstChild)){
				listArray[i].firstChild.style.background = "#00990d"; // green
			} else {
				listArray[i].firstChild.style.background = "#f8f8f8"; // gray
			}
		}
		// close menu:
		document.getElementById('scryptSettings').style.display = "inline";
		//document.getElementById('Settings').style.position = "relative";
	
		// password dialog is shown: Change work factor for new text
		if (document.getElementById("passwordDiv").offsetParent !== null){
			if (document.getElementById("titleDiv").offsetParent !== null){
				// initialization: do nothing
			} else {
				// existing text is open
				alert(lang.apply_new_work_factor);//"Note: To apply the new work factor to an existing text, \n"
				//+ "you must change the password or the title.");
			}	
		} else { // change work factor for existing text	
			// disable text area until password is correct
			//document.getElementById("textField").disabled = true;	
			EditorIntegration.disableEditor();
			// display password fields:
			PageView.showInputForm(false, true, true);
		}
	};


    return {
    	// variables:
    	programName: programName,
    	version: version,
    	// functions:
        init: init,
        checkForExistingStorageKey: checkForExistingStorageKey,
        encryptAndSaveByStoredKey: encryptAndSaveByStoredKey,
        quitProgram: quitProgram,
        clearStorage: clearStorage,
        newText: newText, 
        setWorkFactor: setWorkFactor,
        getWorkFactor: getWorkFactor,
        isTestMode: isTestMode
    };
}) ();




window.onload = BrowserNotebook.init;
