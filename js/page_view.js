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

/*
	load and show the titles, 
	show input form (password dialog and title input), 
	show import file input, 
	show and close encrypted content,
	indicate unsaved changes of the text    
*/
"use strict";
var PageView = (function (){

	// true, if there are text changes, that are not saved:
	var unsavedChanges = false;
	
	// array of existing titles:
	var titles = [];    

  	/** Load existing valid titles: Set array of titles. 
  	 *  This function should be called in init.
 	 */
  	var loadTitles = function () {
  		
  		// get all itmes of local storage:
  		var len = window.localStorage.length;
		if (len === 0 || len == null) {
			return;
		}
		//var numberOfValidItems = 0;
		for ( var i = 0; i < len; i++ ) {
			try {
				// 1. try to parse as JSON 
				var jsonObject = JSON.parse(window.localStorage.getItem(window.localStorage.key(i)));
			} catch(err) {
				//console.log("item: " + localStorage.getItem(localStorage.key(i)));			
				if (err instanceof SyntaxError) { // item is not a JSON object
					if ( window.localStorage.key(i) === "lastTitle") {
						continue; // ignore
					} else {
						console.log("Item of local storage is not a valid JSON object: " 
									+ window.localStorage.key(i));	
						console.log( window.localStorage.getItem(window.localStorage.key(i)) );
						continue; // ignore
					}
				} else { // other Errors than SyntaxError
					errorDisplay(err, true, true, "JSON parsing failed");
				}
			}			
			// 2. check required keys:
   		if ( jsonObject && FileAction.validateNotebookJSON(jsonObject) === true){
			
				// 3. get adata text of the item: Check program name and version
				var adata = sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(jsonObject.adata));
				var key;
				// check if item is from Browser Notebook:
				if (adata.lastIndexOf(BrowserNotebook.programName, 0) === 0) {
					// check version: log warning
					if ( ! (adata.indexOf(BrowserNotebook.version, adata.length - BrowserNotebook.version.length) !== -1) ){
						console.log("Wrong version of Browser Notebook: " + window.localStorage.key(i));
					}	
					// add title to titles array
					key = PswTitleAction.replaceTitleCharacters(window.localStorage.key(i));
					titles.push(key);//window.localStorage.key(i));
				} else {
					// check for old text of version 0.1 (there was no adata, but fixed title)
					if (window.localStorage.key(i) === 'encryptedText'){
						console.log("Old version of Browser Notebook: " + window.localStorage.key(i));	
						// add title to titles array
						key = PswTitleAction.replaceTitleCharacters(window.localStorage.key(i));
						titles.push(key);//window.localStorage.key(i));
					} else {
						console.log("Not a Browser Notebook item: " + window.localStorage.key(i));			
					}				
				}	
			} else { // missing JSON key 
				console.log("Missing required JSON key for cipher text: " + window.localStorage.key(i));
			}
		}
	};
	
	/** Get number of valid titles.
   *  The list must have been set before by loadTitles function	
   *  @return {Number} the number of existing valid text titles
	*/
  	var getNumberOfTitles = function () {
  		return titles.length;  	
 	};
 	
  	/** Show existing titles. 
    *  The list must have been set before by loadTitles function
   */
  	var showTitleList = function () {
  	
  		// parent div of titles
		var titleDiv = document.getElementById("titleListDiv");
	
		// all titles have been checked before in loadTitles function:
		var len = titles.length; 
		if (len === 0 || len == null) { // should never happen, function is called when text exists
			alert(lang.no_text_create);//"There is no text. \nCreate a new text: \n  File -> New...");
			return;
		}	
		// get last opened text title to select
 		var lastTitle = window.localStorage.getItem('lastTitle');

		for ( var i = 0; i < len; i++ ) {
		
			// get key of item:
			var storageKey = BrowserNotebook.escapeString(titles[i]);			

			var titleInListDiv = document.createElement("div");
			titleInListDiv.setAttribute("title", storageKey);
			titleInListDiv.className = "titleInList";			
			
			var titleLabel = document.createElement("label");
			titleLabel.setAttribute("class", "titleLabel");
			var titleLabelText = document.createTextNode(storageKey);
			titleLabel.appendChild(titleLabelText);
			
			var inputRadioButton = document.createElement("input");
			inputRadioButton.setAttribute("type", "radio");
   		inputRadioButton.setAttribute("name", "titleSelection");
   		inputRadioButton.setAttribute("class", "titleInList");
   		inputRadioButton.setAttribute("id", storageKey);
   		   		
   		titleLabel.appendChild(inputRadioButton);   		
   		titleInListDiv.appendChild(titleLabel);
   		// set selected if this was the last opened title
   		// always set one title selected
    		if (i === 0 || ((lastTitle != null) && (lastTitle === storageKey)) || len === 1) {		// first title or last title or only title
    			inputRadioButton.checked = true;											
        		PswTitleAction.setTitle(storageKey);	
    		}
   		// add line breaks
   		titleInListDiv.appendChild(document.createElement("br"));
   		titleInListDiv.appendChild(document.createElement("br"));
    		
			// append created div:
			titleDiv.appendChild(titleInListDiv);
			// Closures: define listeners in extra function
			addTitleListeners(inputRadioButton, storageKey);
   	}
   	
		if (titleDiv.childElementCount === 0) {
			alert("There is no valid encrypted text. \nCreate a new text: \n  File -> New...");
			titleDiv.style.display = "none";
		} else {
			titleDiv.style.display = "block";
		}	
	};	
	
	/** Add listener to title radio button (avoid closure)
	*/
	var addTitleListeners = function (titleInput, storageKey){  
		titleInput.addEventListener("click",  function(){
				PswTitleAction.setTitle(storageKey); });  
  	};

  	/** Show form with required input fields. 
   * @param {boolean} 	titleInput 				show the title input.
   * @param {boolean} 	passwordFieldInput 	show the password field.
   * @param {boolean} 	confirmPasswordInput show the confirm password field.
   */
  	var showInputForm = function (titleInput, passwordFieldInput, confirmPasswordInput) {

		// parent of input fields
		var inputDiv = document.getElementById("formInputDiv");		
		// hide div with ok button if div is empty, show otherwise
		if (titleInput === false && passwordFieldInput === false && confirmPasswordInput === false) {
			// hide div ok button:
			inputDiv.style.display = "none";		
			return;	
		} else { // div is not empty
			if (inputDiv.style.display === "none"){
				inputDiv.style.display = "block";	
			}		
		}				
		// title input div:
		var titleDiv = document.getElementById("titleDiv");
		// separator:
		var sep = document.getElementById("titlePasswordSeparator");
		// password input div:
		var passwordDiv = document.getElementById("passwordDiv");
		// confirm password input div:
		var confirmDiv = document.getElementById("confirmDiv");
	
		var isTitleShown = (titleDiv.offsetParent !== null);
		var isSepShown = (sep.offsetParent !== null);
		var isPasswordShown = (passwordDiv.offsetParent !== null);
		var isConfirmShown = (confirmDiv.offsetParent !== null);
		
		// show or hide title input and separator
		if (titleInput === true){
			// remove previous title from input:
			document.getElementById("titleInput").value = "";
			if (isTitleShown === false) {
				titleDiv.style.display = "block";
				// show separator if password field is shown:
				if (passwordFieldInput === true && isSepShown === false) {
					sep.style.display = "block";
				}			
			} else {
				// hide separator if password field is not shown:
				if (passwordFieldInput === false && isSepShown === true) {
					sep.style.display = "none";
				}	
			}
		} else {
			if (isTitleShown === true) {
				titleDiv.style.display = "none";
				// hide separator:
				if (isSepShown === true) {
					sep.style.display = "none";
				}
			}
		}		
		// show or hide the password field:
		if (passwordFieldInput === true) {
			if (isPasswordShown === false) {
				passwordDiv.style.display = "block";			
			}			
		} else {
			if (isPasswordShown === true) {
				passwordDiv.style.display = "none";			
			}			
		}		
		// show or hide the confirm password field:
		if (confirmPasswordInput === true) {
			if (isConfirmShown === false) {
				confirmDiv.style.display = "block";			
			}			
		} else {
			if (isConfirmShown === true) {
				confirmDiv.style.display = "none";			
			}			
		} 
		// scroll the site to form:
      var rect = inputDiv.getBoundingClientRect();
      window.scrollTo(rect.left, rect.top); 		
  	};

  	/** Indicate whether there are unsaved changes or not: change color of save button.
   * @param {boolean} showUnsaved  new changes occurred
   */
  	var indicateUnsavedChanges = function (showUnsaved){  	
  		if (showUnsaved === true) {
  			if (unsavedChanges === false){ // if not yet set
  				// set button color:
				document.getElementById("encryptButton").style.background='#ffb366';
			}	
			unsavedChanges = true;
  		} else { // unsaved == false, text was saved
  			unsavedChanges = false;
  			// remove button color:
			document.getElementById("encryptButton").style.background = "";
  		}
  	};
  
  	/** Check if there are unsaved text changes.
   * @return {boolean} true, if there are unsaved changes.
   */  
  	var isUnsavedChanges = function (){  
  		return unsavedChanges;	
  	};  
  
  	/** Show a file input to import a file.
   */  
  	var fileImportInput = function (){  	

		// remove input form if shown:
		showInputForm(false, false, false);
		// remove title list if shown:
		document.getElementById("titleListDiv").style.display = "none";
		// remove current title
		document.getElementById("currentTitleDiv").textContent = "";
	
		if ( document.getElementById("importDiv") !== null){
			// close file import
     		document.getElementById("importDiv").outerHTML = "";
		}
		// create div element 
		var importDiv = document.createElement('div');
		importDiv.setAttribute('id', 'importDiv');
		importDiv.classList.add('shadowBorder');
		//importDiv.style.backgroundColor = focusColor;

		// create input element
		var fileInput = document.createElement("input");
      fileInput.setAttribute('id', 'inputFileImport');		
      fileInput.setAttribute("type", "file");
		// accept only JSON files
      fileInput.setAttribute('accept', '.json, .JSON');
		fileInput.addEventListener('change', FileAction.readSingleFile, false);
      
      // add input file to input div and add input div to body
		importDiv.appendChild(fileInput);
      document.body.appendChild(importDiv);  
      document.getElementById("textDiv").parentNode.insertBefore( importDiv, document.getElementById("textDiv") );
      
		// scroll the site to the input field:
      var rect = importDiv.getBoundingClientRect();
		//console.log(rect.top, rect.right, rect.bottom, rect.left);
      window.scrollTo(rect.left, rect.top); 
      fileInput.focus();    	
  	};     
  
  	/** Workaround for export: Set ciphertext to clipboard to
   *  paste in any editor and save as file
   */  
  	var exportWorkaround = function (){  	
		try {		
			// extra menu is not properly closed in some browsers:
			closeExtraMenu();
			// check permission
			const queryOpts = { name: 'clipboard-write', allowWithoutGesture: false };
		
			// get JSON file and display
			var encryptedText = window.localStorage.getItem(PswTitleAction.getTitle());
			var modalContent = document.getElementById('encryptedContent');			
		
			// siehe file_action 285
			modalContent.textContent = ""; // clear all existing children
		
			var clipboradWorkaroundDiv = document.createElement("div");
			clipboradWorkaroundDiv.setAttribute("id", 'encryptedTextDiv');
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
			clipboradWorkaroundDiv.appendChild(document.createTextNode(lang.export_workaround_text)	);
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));						
			clipboradWorkaroundDiv.appendChild(document.createTextNode(BrowserNotebook.escapeString(PswTitleAction.getTitle()) + ".json" ));
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
			// show the encrypted text to copy manually, but hide until FAILED? was pressed
			var labelWorkaroundCiphertext = document.createElement("label");
			labelWorkaroundCiphertext.setAttribute("id", 'labelShowEncryptedText');
			labelWorkaroundCiphertext.htmlFor = 'encText';
			labelWorkaroundCiphertext.style.display = "none";
			labelWorkaroundCiphertext.appendChild(document.createTextNode(lang.export_manually)	);
			clipboradWorkaroundDiv.appendChild(labelWorkaroundCiphertext);
			// new line to hide and show
			var pWorkaroundCiphertext = document.createElement("p");
			pWorkaroundCiphertext.setAttribute("id", 'NL');
			pWorkaroundCiphertext.style.display = "none";
			clipboradWorkaroundDiv.appendChild(pWorkaroundCiphertext);
			var workaroundTextarea = document.createElement("textarea");
			workaroundTextarea.setAttribute('id', "showEncryptedText");
			workaroundTextarea.rows = "10";
			workaroundTextarea.cols = "50";
			workaroundTextarea.appendChild(document.createTextNode(encryptedText));
			workaroundTextarea.style.display = "none";
			clipboradWorkaroundDiv.appendChild(workaroundTextarea);
			clipboradWorkaroundDiv.appendChild(document.createElement("br"));			
			
			// show buttons to copy and to close and failed? button for further workaround: 
			var copyButton = document.createElement("button");
			copyButton.className = "close";
			copyButton.setAttribute('title','copy');
			copyButton.appendChild(document.createTextNode(lang.copy_ciphertext) );    		
			clipboradWorkaroundDiv.appendChild(copyButton);
			copyButton.addEventListener("click",  function(){
				PageView.copyToClipboard(); });						
			var failedButton = document.createElement("button");
			failedButton.className = "close";
			failedButton.setAttribute('title','workaround if this failed');
			failedButton.appendChild(document.createTextNode(lang.export_failed) );    		
			clipboradWorkaroundDiv.appendChild(failedButton);
			failedButton.addEventListener("click",  function(){
				PageView.extraExportWorkaround(); });				
			var closeButton = document.createElement("button");
			closeButton.className = "close";
			closeButton.setAttribute('title','close encrypted text view');
			closeButton.appendChild(document.createTextNode(lang.close_ciphertext) );    		
			clipboradWorkaroundDiv.appendChild(closeButton);
			closeButton.addEventListener("click",  function(){
				PageView.closeEncryptedText(); });				
			
			modalContent.appendChild(clipboradWorkaroundDiv);
			document.getElementById('encryptedTextModal').style.display = "block";
			
		}	catch (err) { // display encrypted text in alert...
			errorDisplay(err, false, true, "Showing encrypted text failed");
 			alert(window.localStorage.getItem(BrowserNotebook.escapeString(PswTitleAction.getTitle())));
 		}  
  	};  
  
    /** Workaround for workaround: 
     *  show encrypted text to copy manually
     */
	var extraExportWorkaround = function () {
		document.getElementById('labelShowEncryptedText').style.display = "block";
		document.getElementById('NL').style.display = "block";
		document.getElementById('showEncryptedText').style.display = "block";
		// enlarge the div:
		document.getElementById('encryptedTextDiv').style.height = "20em";
	}
	
  	/** Copy the encrypted text to clipboard
   *  and show success message or error
   */
	var copyToClipboard = function () {		
		/* check if navigator is available */
		if (!navigator.clipboard) {
    		alert("Clipboard access not supported: ");
    		return;
  		}
  		if ( ! navigator.clipboard.writeText) {
  		   alert("Clipboard write not supported: ");
    		return;
  		}
  		/* Get the text field */
  		var encryptedText = window.localStorage.getItem(PswTitleAction.getTitle());
  
  		/* check if this is really the encrypted text */
  		if (FileAction.validateNotebookJSON(JSON.parse(encryptedText)) === true){

  			/* Set text to clipboard */
  			navigator.clipboard.writeText(encryptedText).then(() => {
  				/* clipboard successfully set */
    			/* Create a substring to show: The user can check for completeness */
  				var ciphertextToShow = encryptedText;
  				var encryptedTextLen = encryptedText.length;
  				if (encryptedTextLen > 300) {
  					ciphertextToShow = encryptedText.substr(0, 200) // show all values, but cut ciphertext
  					+ "\n...\n...\n" 
  					+ encryptedText.substr(encryptedTextLen - 32, encryptedTextLen -1); // show end of ciphertext
  				}
  				/* Alert the copied text */
  				alert("Copied: \n\n" + ciphertextToShow);
			}, () => {
 				 /* clipboard write failed */
  				alert("Copy failed... " );
			});

  		} else {
  			alert("Copy failed: invalid ciphertext " + encryptedText);
  		}
	};
	
	/** Close the modal display of encrypted text, 
	 *	when close button was clicked
	 */
	var closeEncryptedText = function () {
    	document.getElementById('encryptedTextModal').style.display = "none";
	};  
	
	/** Close extra menu
	 */
	 var closeExtraMenu = function () {
		// close all nodes manually:
		var nodes = document.getElementById('extraMenuList').getElementsByTagName("*");
		for (var i=0; i < nodes.length;i++){
			 nodes[i].style.position = "absolute";
		}	 	
	 };
	 
	/** Reset the previously closed extra menu
	 * (especially Safari/Chrome for iOS do not properly close the menu)
	 */
	 var resetExtraMenu = function () {
    	// reset position of extra menu
    	var nodes = document.getElementById('extraMenuList').getElementsByTagName("*");
		for (var i=0; i < nodes.length; i++){
			 nodes[i].style.position = "relative";
		}	 	
	 };
	 
  	/** Display an error message on screen and in console 
    * @param {Object} 	e			the error object
    * @param {boolean} 	displayMessage	true: display message on screen (alert)
    * @param {boolean} 	logConsole  	true: log stack, message of error in console  
    * @param {String} 	extraMessage  	extra message for this error
   */
	var errorDisplay = function (e, displayMessage, logConsole, extraMessage) { 	 

		if(displayMessage === true) {
 			alert(lang.unexpected_error + "\n" + e.name 
					+ "\n" + e.message + "\n" + 
					(extraMessage ? extraMessage : "") );
		}
		if (logConsole === true) {
			// create message string for console:
			var firefoxString = 
				 ( (typeof(e.fileName) != "undefined") ? "\nfile: " + e.fileName : "")	// Firefox
				+ ( (typeof(e.lineNumber) != "undefined") ? "\nline: " + e.lineNumber : "")	// Firefox
				+ ( (typeof(e.columnNumber) != "undefined") ? "\ncolumn: " + e.columnNumber : "");	// Firefox
			var microsoftString = ( (typeof(e.description) != "undefined") ? "\ndescription: " + e.description : "") // Microsoft
				+ ( (typeof(e.number) != "undefined") ? "\nnumber: " + e.number : "");// Microsoft
  			var stack = "\nstack: \n" + e.stack;				
 			var consoleMessage = "";
 			if (extraMessage) {
 				consoleMessage += extraMessage;	
 			}
  			if (firefoxString) {
    			consoleMessage += firefoxString;
  			}
    		if (microsoftString) {
    			consoleMessage += microsoftString;
  			}
  			if (stack) {
  				consoleMessage += stack;
  			}
  			console.log(e.name + ": " + e.message + consoleMessage);
  			if (BrowserNotebook.isTestMode() === true) {
				alert(consoleMessage);// test mode  			
			}
  		}			
	};
  
  	return { // make functions public:
  		loadTitles: loadTitles,
  		getNumberOfTitles: getNumberOfTitles,
  		showTitleList: showTitleList,
  		addTitleListeners: addTitleListeners,
    	showInputForm: showInputForm,
    	indicateUnsavedChanges: indicateUnsavedChanges,
    	isUnsavedChanges: isUnsavedChanges,
    	fileImportInput: fileImportInput, 
    	exportWorkaround: exportWorkaround, 
    	extraExportWorkaround: extraExportWorkaround,
    	copyToClipboard: copyToClipboard,
    	closeEncryptedText: closeEncryptedText,
    	closeExtraMenu: closeExtraMenu, 
    	resetExtraMenu: resetExtraMenu, 
    	errorDisplay: errorDisplay
  	};
})();
