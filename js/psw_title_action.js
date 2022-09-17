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
var PswTitleAction = (function () {

	// title of the current text item:
	var currentTextTitle = "";

	// if text title is changed: old title to remove
	var oldTitleToRemove = "";	
	
	// hourglass image to indicate processing
	var hourGlass;
	
	//========================= PRIVATE FUNCTIONS ================================================
	
	/** Show an hourglass image and change cursor to wait cursor
	 * to indicate a time consuming process (the callback function)
	 * @param {function} [callback] 		The function to call after showing the hourglas 
	 * private function
	 */
	var _showHourGlass = function (callback){
		// on first call,hourGlass is not defined:
		if (hourGlass == null){
			hourGlass = document.getElementById("hourglass");
		}
		// show hourglass to indicate that program is working
		try {
			hourGlass.style.visibility = "visible";
		} catch (err) {
			PageView.errorDisplay(err, false, true, "Couldn't load hourglass... ");
		}
		// show wait cursor
		//document.getElementsByTagName("body")[0].style.cursor = "wait"; 
		//document.getElementById("passwordDiv").style.cursor = "wait"; 
		try {		
  			document.styleSheets[0].insertRule("* {cursor: wait !important}", 0);
  		} catch (err) {
  			if (err.name !== 'SecurityError'){ // for Firefox
  				PageView.errorDisplay(err, true, true, "Couldn't load wait cursor... ");
  				//alert(lang.unexpected_error + "\n" + err.name + "\n" +err.message + "\n line: " + err.code);
      		//throw err;
   		} 
  		}  	  		
  		// wait for showing the image and wait cursor...
  		setTimeout(callback, 200);
	};
	
	/** Hide hourgalss image and reset cursor to default
	  * @param {function} [callback] 		The function to call after hiding the hourglas 
	  * private function
	*/
	var _hideHourGlass = function (){
		try {
			hourGlass.style.visibility = "hidden";
		} catch (err) {
  			PageView.errorDisplay(err, false, true, "Couldn't hide hourglass... ");
  		}
  		//document.getElementsByTagName("body")[0].style.cursor = "default"; 
  		//document.getElementById("passwordDiv").style.cursor = "default"; 
		try {
			//document.body.style.cursor = 'default';
			document.styleSheets[0].deleteRule(0);
		} catch (err) {
  		 	if (err.name !== 'SecurityError'){  // for Firefox
      		PageView.errorDisplay(err, true, true, "Couldn't reset wait cursor... ");
   		} 
  		}
	};	
	
	/** Derive key, decrypt content and store key
	 * (File import / open encrypted content)
	 * and set indicator for long process (callback function)
 	 * @param {psw} [String] the password
  	 * @param {cipherText} [String] the cotent to decrypt
    * @param {callback} [function] function to indicate long running process
    * private function
	 */
	var _decryptByPassword = function (psw, cipherText, callback){
	
		try {
			// decrypt 
  			var plainText = sjcl.decryptWithScryptAndAES256(psw, cipherText);
  			
  			// file import: store the imported text:
  			if (document.getElementById("currentTitleDiv").offsetParent === null) { //  hidden
  				BrowserNotebook.encryptAndSaveByStoredKey();
  			}
  			// set the content to the area
  			//document.getElementById("textField").value = plainText;
  			EditorIntegration.setContent(plainText);
 
  			// remove the password field:
  			PageView.showInputForm(false, false, false);

			PageView.indicateUnsavedChanges(false);
			// enable text area
			//document.getElementById("textField").disabled = false;
			EditorIntegration.enableEditor();
			// change placeholder
//			document.getElementById("textField").placeholder = lang.enter_text_placeholder;//"Enter your text...";
			//EditorIntegration.setContent("");		
  			  			
  			// remove titles:
  			if (document.getElementById("titleListDiv") != null
  					&& document.getElementById("titleListDiv").style.display === "block"){
  				var listNode = document.getElementById("titleListDiv");
				while (listNode.firstChild != null) {
    				listNode.removeChild(listNode.firstChild);
				}		
			}
 		
		 	// show the title of the text:
		 	document.getElementById("currentTitleDiv").textContent = "";
		 	var titleSpan = document.createElement('span');
		 	titleSpan.setAttribute("id", "currentTitleSpan");
		 	titleSpan.appendChild(document.createTextNode(BrowserNotebook.escapeString(PswTitleAction.getTitle())));
		 	document.getElementById("currentTitleDiv").appendChild(titleSpan);		 		
		 		
			// hide the info text about program and version:
			document.getElementById("programInfo").style.display = "none";
		} catch (err) {
  			if (err.toString().match("tag doesn't match")){
  				alert(lang.wrong_password);//"Wrong password");
  				document.getElementById("passwordField").value = "";
  				// reload page:
  				location.reload(); 
  			} else {
  				PageView.errorDisplay(err, true, true, "Decryption by password failed... ");
  				location.reload();   			
  			} 
  		} finally {
  			// hide hourglass, reset wait cursor in this function:
			callback();
  		} 
	};
	
	/** Derive key, encrypt content or just store key
	 * (Initialization / password change)
	 * and set indicator for long process (callback function)
 	 * @param {psw} [String] the password
  	 * @param {plainText} [String] the cotent to encrypt
    * @param {callback} [function] function to indicate long running process
    * private function
	 */	
	var _encryptByPassword = function (psw, plainText, callback) {
	
		if (psw === null ) {
			alert(lang.first_enter_password);//"You must first enter the password...");
			return;
		}	

		// encrypt the text
		try {
			// work factor was eventually changed 		
			//console.log("workFactor encrypt: " + BrowserNotebook.getWorkFactor());	
			var rpStr = '{ "iter" : ' + BrowserNotebook.getWorkFactor() + ', "adata" : "' 
				+ BrowserNotebook.programName + BrowserNotebook.version + '" }'; 
			var rp = JSON.parse(rpStr);

			var encryptedText = sjcl.encryptWithScryptAndAES256(psw, plainText, true, rp);// change password

			// Store: this is already a JSON object
			window.localStorage.setItem(PswTitleAction.getTitle(), encryptedText);
			console.log("Encrypted text stored");

			// remove password field if visible:
			PageView.showInputForm(false, false, false);
  			
  			// show that text is saved:
  			PageView.indicateUnsavedChanges(false);

		} catch (err) {			
			if ( err.toString().match("TypeError") 
					&& err.toString().match("undefined") ){
				// missing password...
				alert(lang.first_enter_password);//"You must type a password... ");
				console.log(err);
			} else if (err.name.toUpperCase().includes("QUOTA") ) {
				alert(lang.memory_limit_exceeded);
				PageView.errorDisplay(err, false, true, "Saving and encryption failed...");
			} else {
				PageView.errorDisplay(err, true, true, "Saving and encryption by password failed...");	
			} 
		} finally {
			// hide hourglass, reset wait cursor in this function:
			callback();		
		}	
	};	
	
	/** Compare two Strings in constant time (if length is equal)
    * @param {String} 	a 	String to compare
    * @param {String} 	b 	String to compare   
  	 * @return {boolean} true if the Strings are equal    
  	 * private function
	*/
	var _compareStrings = function (a, b) {
    	if (a.length !== b.length) {
    		return false;
    	}
    	var result = 0;
    	for(var i = 0; i < a.length; i++) {
        	result |= (a.charCodeAt(i) ^ b.charCodeAt(i) );
    	}
    	if (result === 0){
    		return true;
    	} else {
    		return false;
    	}
	};
	
	
	//========================= PUBLIC FUNCTIONS ================================================	
	
 	/** Replace probably problematic characters 
  	 * for JSON object with underscore
  	 * private function
 	 */
 	var replaceTitleCharacters = function (newTitle){
		// replace problematic characters: 		
 		return newTitle.replace(/[\-\[\]\/\{\}\(\)\,\'\"\.\\\&\|\<\>\;\:\=]/g, "_");
	};	
	
 	/** Get the title of the current text
  	 * @return {String} the title of the current text  
    */ 
 	var getTitle = function () {   
 		return BrowserNotebook.escapeString(currentTextTitle);
 	};
 	
  /** Set the title of the current text
   * @param {String} newTitle  the title of the current text  
   */ 
 	var setTitle = function (newTitle) {   //alert("pswtitleaction260 " + newTitle);
 		newTitle = replaceTitleCharacters(newTitle);
 		currentTextTitle = newTitle;
 		//document.getElementById("titleInput").value = newTitle;
 	};
 	
	/** Change the title of the current text
	 */
	var changeTitle = function (){
	
		if ( document.getElementById("passwordDiv").offsetParent !== null){
			alert(lang.first_enter_password);//"You must first enter the password...");
			return;
		}	
		// store old title to remove later
		oldTitleToRemove = currentTextTitle;
		PageView.showInputForm(true, false, false);
		document.getElementById("titleInput").focus();
	}; 

	/**Change the password
	 */
	var changePassword = function () {	
		
		// password dialog is shown...
		if (document.getElementById("passwordDiv").offsetParent !== null){
			alert(lang.first_enter_password);//"You must first enter the password...");
			return;
		}
		// close extra menu:
		PageView.closeExtraMenu();
		// show input form without title input:
		PageView.showInputForm(false, true, true);
		document.getElementById("passwordField").focus();
	};	
 
 	/** onclick function of password and title form button.
  	*  Handles values of shown input fields: password, confirm password, title.
  	*  Used for: initialization, open/decrypt text, password change, change title
  	*/
 	var processInputForm = function () {
 		
		// check title input:
		if (document.getElementById("titleDiv").offsetParent !== null) { // visible
			// get new title
			var newTitle = document.getElementById("titleInput").value;

			// set to default if null
			if (newTitle == null || newTitle === "") {
			newTitle = "default";
			}

			// replace problematic HTML/JSON characters
			newTitle = replaceTitleCharacters(newTitle);

			// check if already exists and ask to break
			if (BrowserNotebook.checkForExistingStorageKey(newTitle) === true) {
				var r = confirm(lang.existing_title//"There is already a content named " 
				+ "\n" + newTitle + "\n" 
				+ lang.import_overwrites);
				if (r == false) {	
					console.log("break new text...");
					// reload the page:
					window.location.reload();
					return;
				} 
			}		
			// set new title
			currentTextTitle = newTitle;
		}
		//console.log("title: " + currentTextTitle);
	
		// check password and confirm password: initialization or password change
		if (document.getElementById("confirmDiv").offsetParent !== null) { // confirm password field is visible
	  	
	  		// check if password is null
  			var psw = document.getElementById("passwordField").value;
  			if (psw === null || psw === "") {
  				alert(lang.type_and_confirm);//"You must type and confirm a password...");
  				psw = "";
  				return;
  			}  		
  			// check if confirm password is null
  			var retypePsw = document.getElementById("confirmPasswordField").value;
  			if (retypePsw === null || retypePsw === "") {
  				alert(lang.confirm_password);//"You must confirm the password...");
  				return;
  			}  		
  			// check if passwords are equal
  			if (_compareStrings(psw, retypePsw) === true) { //psw === confirmPsw) {  			
  				try{
  					var plainText = EditorIntegration.getContent();
  					//var plainText = document.getElementById("textField").value;// this might be ""
					_showHourGlass(function() {
  						_encryptByPassword(psw, plainText, function() {
    						_hideHourGlass();
  						});
					});  		
  				}catch (err) {
  					PageView.errorDisplay(err, false, true, "Encryption of content failed... ");
  				}			
				// reset	
  				//var confirmPassword = false;
  							
		 		// show the title of the text:
		 		document.getElementById("currentTitleDiv").textContent = "";
		 		var titleSpan = document.createElement('span');
		 		titleSpan.setAttribute("id", "currentTitleSpan");
		 		titleSpan.appendChild(document.createTextNode(BrowserNotebook.escapeString(BrowserNotebook.escapeString(currentTextTitle))));
		 		document.getElementById("currentTitleDiv").appendChild(titleSpan);			
				
				// set last opened text title: 
 				window.localStorage.setItem( 'lastTitle', currentTextTitle);
  			  			
  				// enable text area
				//document.getElementById("textField").disabled = false;
				EditorIntegration.enableEditor();

  			} else {
  				alert(lang.password_confirm_not_equal);//"Password and confirmed password are not equal");		
  				document.getElementById("confirmPasswordField").value = "";
  				return;
  			}	  		
  		
		} else { // confirm field is hidden
			// Case 1: change title
			if (document.getElementById("passwordDiv").offsetParent === null) { // password field is also hidden
		
				// title was changed: encrypt by key
				BrowserNotebook.encryptAndSaveByStoredKey();
				// display new text title
		 		document.getElementById("currentTitleDiv").textContent = "";
		 		var titleSpan = document.createElement('span');
		 		titleSpan.setAttribute("id", "currentTitleSpan");
		 		titleSpan.appendChild(document.createTextNode(BrowserNotebook.escapeString(BrowserNotebook.escapeString(currentTextTitle))));
		 		document.getElementById("currentTitleDiv").appendChild(titleSpan);			
				
				
				// set last opened text title: 
 				window.localStorage.setItem( 'lastTitle', currentTextTitle);		
 				// remove old item
 				if (oldTitleToRemove !== ""){
					localStorage.removeItem(oldTitleToRemove);
					oldTitleToRemove = "";
				} else {
					console.log("Could not find old text title to remove...");
				}
			// Case 2: open/decrypt text
			} else {	// open/decrypt existing/imported/dropbox text
		
				// decrypt the text: 	
				if (currentTextTitle == null || currentTextTitle === "") {
					alert(lang.no_title_error);//"Error: There is no title");
					return;
				}		
		
 				// get password
				var psw = document.getElementById("passwordField").value;
				if (psw === null || psw === ""){			
					alert(lang.first_enter_password);//"You must type a password...");
					return;
				}			
				// clear password field:
				document.getElementById("passwordField").value = "";

				// get encrypted text from local storage
				// (file import stores cipher text)
				// TODO do not store before password fits..., set cipherText variable
  				var encryptedText = window.localStorage.getItem(currentTextTitle);
  				try {
  					if (encryptedText ) {
						// 1. show hourglass, 2. decrypt and display, 3. hide hourglass
						_showHourGlass(function() {
  							_decryptByPassword(psw, encryptedText, function() {
    							_hideHourGlass();
  							});
						});  	
						// get last opened text title: 
 						window.localStorage.setItem( 'lastTitle', currentTextTitle);
  					} else {
						console.log("No stored text...");			
  					}
  				} catch (err) {
  					PageView.errorDisplay(err, true, true, "Decryption of content failed... ");
  				}
  			}
		}
		// hide all input fields:
		PageView.showInputForm(false, false, false);
		// hide title list:
		document.getElementById("titleListDiv").style.display = "none";
		document.getElementById("programInfo").style.display = "none";
 	};
  
  	return { // make functions public:
  		processInputForm: processInputForm, 
  		getTitle: getTitle, 
  		setTitle: setTitle, 
  		changePassword: changePassword,
  		changeTitle: changeTitle,
  		replaceTitleCharacters: replaceTitleCharacters
  	};
})();
