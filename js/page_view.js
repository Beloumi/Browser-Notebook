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
var PageView = (function () {

	// true, if there are text changes, that are not saved:
	var unsavedChanges = false;
	
	// array of existing titles:
	var titles = [];    

  	/** Load existing valid titles: Set array of titles. 
  	 *  This function should be called in init.
 	 */
  	var loadTitles = function () {
  		
  		// get all itmes of local storage:
  		var len = localStorage.length;
		if (len === 0 || len == null) {
			return;
		}
		//var numberOfValidItems = 0;
		for ( var i = 0; i < len; i++ ) {
			try {
				// 1. try to parse as JSON 
				var jsonObject = JSON.parse(localStorage.getItem(localStorage.key(i)));
			} catch(err) {
				//console.log("item: " + localStorage.getItem(localStorage.key(i)));			
				if (err instanceof SyntaxError) { // item is not a JSON object
					if ( localStorage.key(i) === "lastTitle") {
						continue; // ignore
					} else {
						console.log("Item of local storage is not a valid JSON object: " 
									+ localStorage.key(i));	
						console.log( localStorage.getItem(localStorage.key(i)) );
						continue; // ignore
					}
				} else { // other Errors than SyntaxError
					throw(err);			
				}
			}			
			// 2. check required keys:
   		if (FileAction.validateNotebookJSON(jsonObject) === true){
			
				// 3. get adata text of the item: Check program name and version
				var adata = sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(jsonObject.adata));
				// check if item is from Browser Notebook:
				if (adata.lastIndexOf(BrowserNotebook.programName, 0) === 0) {
					// check version: log warning
					if ( ! (adata.indexOf(BrowserNotebook.version, adata.length - BrowserNotebook.version.length) !== -1)){
						console.log("Wrong version of Browser Notebook: " + localStorage.key(i));
					}	
					// add title to titles array
					titles.push(localStorage.key(i));
				} else {
					// check for old text of version 0.1 (there was no adata, but fixed title)
					if (localStorage.key(i) === 'encryptedText'){
						console.log("Old version of Browser Notebook: " + localStorage.key(i));	
						// add title to titles array
						titles.push(localStorage.key(i));
					} else {
						console.log("Not a Browser Notebook item: " + localStorage.key(i));			
					}				
				}	
			} else { // missing JSON key 
				console.log("Missing required JSON key for cipher text: " + localStorage.key(i));
			}
		}
	}
	/** Get number of valid titles.
   *  The list must have been set before by loadTitles function	
   *  @return {Number} the number of existing valid text titles
	*/
  	var getNumberOfTitles = function () {
  		return titles.length;  	
 	}	
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
 		var lastTitle = localStorage.getItem('lastTitle');

		for ( var i = 0; i < len; i++ ) {
		
			// get key of item:
			var storageKey = titles[i];
			// get value of key:
			var encryptedText = JSON.parse(localStorage.getItem(storageKey));
		
			// create radio input with name and onclick function to set the title
			var radioHtml = '<div"><label style="border: 1px solid gray; padding:5px 10px 5px 5px"><input id="' + storageKey + '"'
				+  ' style="float: left"'
				+ ' type="radio" name="titleSelection"' 
				+ ' onclick="PswTitleAction.setTitle(' + '\'' + storageKey + '\')"';
//=======> workaround for old version 0.1: 
			// there is no version and no program name,
			// but the fixed key 'encryptedText'
			if (storageKey === 'encryptedText'){ // Version 0.1
				storageKey = "Old version text";
			}    					
			// set selected if this was the last opened title
    		if ( ((lastTitle != null) && (lastTitle === storageKey)) // last opened title
    			|| len === 1) {													// only title
        		radioHtml += ' checked="checked"';        
        		// set the title
        		PswTitleAction.setTitle(storageKey);	
    		}
    		radioHtml += '/>' +  storageKey + '</label></div><br/><br/>';
 		//console.log("Title: " +PswTitleAction.getTitle());
    		titleDiv.innerHTML += radioHtml;
   	}

		if (titleDiv.childElementCount === 0) {
			alert("There is no valid encrypted text. \nCreate a new text: \n  File -> New...");
			titleDiv.style.display = "none";
		} else {
			titleDiv.style.display = "block";
		}
	}  	   

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
				document.getElementById("encryptButton").style.background='#b3ffb9';
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
	document.getElementById("currentTitleDiv").innerHTML = "";
	
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
		// accept only text files
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
  
  /** Show the JSON file with encrypted content.
   */  
  var showEncryptedText = function (){  	
	try {		
		// extra menu is not properly closed in some browsers:
		closeExtraMenu();
		// get JSON file and display
		var encryptedText = window.localStorage.getItem(PswTitleAction.getTitle());
		var modalContent = document.getElementById('encryptedContent');	
		modalContent.innerHTML = "<div id='encryptedTextDiv' style='word-wrap: break-word"
		+ "; height: " + (screen.height / 3) + "px; overflow:auto'>" 
			+ PswTitleAction.getTitle() + ".json:<br/>" + encryptedText + "</div>" 
			+ "<button  onclick='PageView.closeEncryptedText()' style='font-size:14px'>close</button>";
			//console.log("content: " + modalContent.innerHTML);
		document.getElementById('encryptedTextModal').style.display = "block";
			
	}	catch (err) { // display encrypted text in alert...
		console.log(err);
 		alert(window.localStorage.getItem(PswTitleAction.getTitle()));
 	}  
  };  
	/** Close the modal display of encrypted text, 
	 *	when close button was clicked
	 */
	var closeEncryptedText = function () {
    	document.getElementById('encryptedTextModal').style.display = "none";
    	// reset position of extra menu
 /*   	var nodes = document.getElementById('extraMenuList').getElementsByTagName("*");
		for (var i=0; i < nodes.length; i++){
			 nodes[i].style.position = "relative";
		} */
	};  
	/** Close extra menu
	 *
	 */
	 var closeExtraMenu = function () {
		// close all nodes manually:
		var nodes = document.getElementById('extraMenuList').getElementsByTagName("*");
		for (var i=0; i < nodes.length;i++){
			 nodes[i].style.position = "absolute";
		}	 	
	 }
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
  
  	return { // make functions public:
  		loadTitles: loadTitles,
  		getNumberOfTitles: getNumberOfTitles,
  		showTitleList: showTitleList,
    	showInputForm: showInputForm,
    	indicateUnsavedChanges: indicateUnsavedChanges,
    	isUnsavedChanges: isUnsavedChanges,
    	fileImportInput: fileImportInput, 
    	showEncryptedText: showEncryptedText, 
    	closeEncryptedText: closeEncryptedText,
    	closeExtraMenu: closeExtraMenu, 
    	resetExtraMenu: resetExtraMenu
  	};
})();
    //  PageView.indicateUnsavedChanges(false);
    //  PageView.showInputForm(false, false, false);
