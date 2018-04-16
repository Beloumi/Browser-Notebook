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
var EditorIntegration = (function () {
	
	// Instance of Pell editor
	var textEditor;
	
	// width and height of inserted image
	var imageWidth = 300;
	var imageHeight = 400;

// Execute a document command, see reference:
// https://developer.mozilla.org/en/docs/Web/API/Document/execCommand
//pell.exec(command<string>, value<string>)


	//========================= PRIVATE FUNCTIONS ================================================
	
	/** Handle the drop event: Prevent inserting links, 
  	 *  because these are not encrypted
	*/
	var _dropHandling = function (e) {
		// check for images and resize
		var files = e.dataTransfer.files||e.target.files; // File list
		if (files[0]) {
			e.preventDefault();
			if ( _checkValidImage(files[0]) === true) {
				_insertImage(files[0]);
				console.log("images inserted: " + files[0].name);
			}
			e.stopPropagation();
        	return false;
		}
		// do not allow inserting as link:
		var dataTypes = e.dataTransfer.types;
		// check manually (includes is not supported in IE)
		var typesContainUri = false;
    	var x = dataTypes.length;
    	while (x--) {
       	if (dataTypes[x] === "text/uri-list") {
           typesContainUri = true;
       	}
    	}
		// if (dataTypes.indexOf("text/uri-list") > -1) { // failed for edge and IE
		if (typesContainUri === true) { // contains uri
			console.log("Not allowed data type: text/uri-list");
			e.stopPropagation();
			e.preventDefault();
         return false;			
		}
	};
	/** Set the caret and focus to the end of the document
	 *  private function
	 */
	var _setCaretToEnd = function () {
		// get current element (textEditor does not work properly)
		var el = document.getElementsByClassName("pell-content")[0];
		// create a selection as range at the last node
		var node = el.lastChild;
		var range = document.createRange();
		var sel = window.getSelection();
		range.setStart(node, 0);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
		el.focus();
	};	

	/** Check if a given file is a valid image 
	 *  @param {Object} [file] The file to check
	 *  private function
	 */
	var _checkValidImage = function (file) {
		if (file) {
			// 1. check type:
			if (file.type.match('image.*')) {
    			//console.log("type is image");
    			return true;
			} else {
				// 2. check extension:
				var extension = file.name.substring(file.name.lastIndexOf('.'));
				var validFileType = ".jpg , .png , .bmp , .gif , .jpeg , .tiff , .svg , .ico";
    			if (validFileType.toLowerCase().indexOf(extension) < 0) {
        			console.log("File extension: not image");
        			return false;
    			} else {
    				return true;
    			}				
			}
       /* Too many false negative results
       var image = new Image();
        image.onload = function() {
            if (this.width) {
                 return true; // image has width
            } else {
            	return false;
            }
        };*/
    	} else {
    		console.log("no file");
    	}
		return false;
	};	
	
	/** Insert an image in pell content area: 
	 *  resize if required, set caret if required. 
	 * @param {Object} [file] the image as file
	 * private function
	 **/
	 var _insertImage = function(file) {
// see: https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/ 	
//var img = document.createElement("img");
//img.src = window.URL.createObjectURL(file);

		// if not: set caret
		if ( window.getSelection().anchorNode.parentNode.className !== 'pell-content') {
			_setCaretToEnd();
		}
		var reader  = new FileReader();
   	reader.readAsDataURL(file);
   	reader.onload = function(e)  {

   		// create image:
        	var image = document.createElement("img");
			image.onload = function () {
   			//alert("image is loaded");
   			//console.log("original width onload: " + image.width);
        		if (image.width <= imageWidth) {
        			// no need to resize
        			// do no display larger than current device width
        	  		var imageMaxWidth = document.getElementById('textDiv').offsetWidth - 100;  		
  					//console.log("result: " + reader.result);
     				// embed image
     				pell.exec("insertHTML",  "<img style='float:left; margin:10px 10px 10px 0px; "
     				+ "max-width:" + imageMaxWidth + "px' src='"  
     				+ reader.result + "'>");// use file directly
        		} else {
        			// resize the image
					// draw this image in a <canvas> element to pre-process the file
					var canvas = document.createElement('canvas');	
					// resize, keep the ratio:
					var MAX_WIDTH = imageWidth;
					var MAX_HEIGHT = imageHeight;
					var width = image.width;
					var height = image.height; 
					if (width > height) {
  						if (width > MAX_WIDTH) {
   						height *= MAX_WIDTH / width;
    						width = MAX_WIDTH;
  						}
					} else {
  						if (height > MAX_HEIGHT) {
    						width *= MAX_HEIGHT / height;
    						height = MAX_HEIGHT;
  						}
					}
					canvas.width = width;
					canvas.height = height;

					var ctx = canvas.getContext("2d");
    				ctx.drawImage(image, 0, 0, width, height);

    				var source = canvas.toDataURL();		
					var imageMaxWidth = document.getElementById('textDiv').offsetWidth - 100;  	

     				pell.exec("insertHTML",  "<img style='float:left; margin:10px 10px 10px 0px; "
     				+ "max-width:" + imageMaxWidth + "px' src='"  
     				+ source + "'>");
				}
			}
			image.src = e.target.result;
	
        	// close file import
     		if (document.getElementById("importDiv") != null){
     			document.getElementById("importDiv").outerHTML = "";
     		}
     	}
   	reader.onerror = function (error) {
   		PageView.errorDisplay(error, true,true, "couldn't load image" );
   	};		     	
        //document.body.appendChild(image);
	};


	//========================= PUBLIC FUNCTIONS ================================================ 

	/** Initialize and set the editor instance
	*/
	var setEditor = function () {
	 	
		// Initialize pell on an HTMLElement
		textEditor = pell.init( {
			
 			element: document.getElementById('pell'),
	
  			//onChange: html => PageView.indicateUnsavedChanges(true),
  			onChange: function html() {
  				 PageView.indicateUnsavedChanges(true);
  			},

  			styleWithCSS: false,

  			// <Array[string | Object]>, string if overwriting, object if customizing/creating
  			// action.name<string> (only required if overwriting)
  			// action.icon<string> (optional if overwriting, required if custom action)
  			// action.title<string> (optional)
  			// action.result<Function> (required)
  			// Specify the actions you specifically want (in order)
  			actions: [
    			'bold',
    			'italic',
    			'underline',
    			'strikethrough',
    			 // colors:
    			 {
      			name: 'red',  
      			icon: '<span style="background-color:red; font-size:16px">&nbsp;&nbsp;</span>', 
      			title: 'Red Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'red');
    				}
    			 },
    			 {
      			name: 'blue',  
      			icon: '<span style="background-color:blue; font-size:16px">&nbsp;&nbsp;</span>', 
      			title: 'Blue Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'blue');
    				}
    			 },
    			 {
      			name: 'black',  
      			icon: '<span style="background-color:black; font-size:16px">&nbsp;&nbsp;</span>', 
      			title: 'Black Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'black');
    				}
    			 },
    			 {
      			name: 'green',  
      			icon: '<span style="background-color:green; font-size:16px">&nbsp;&nbsp;</span>', 
      			title: 'Green Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'green');
    				}
    			 },
    			 {
      			name: 'gray',  
      			icon: '<span style="background-color:gray; font-size:16px">&nbsp;&nbsp;</span>', 
      			title: 'Gray Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'gray');
    				}
    			 },    			
    			 {
      			name: 'font size 2',  
      			icon: '<span style="font-size:9px">9</span>', 
      			title: 'Font Size 2',
 					result:  function result() {
      				return pell.exec('fontSize', '2');
    				}
    			 },    			
    			 {
      			name: 'font size 3',  
      			icon: '<span style="font-size:12px">12</span>', 
      			title: 'Font Size 3',
 					result:  function result() {
      				return pell.exec('fontSize', '3');
    				}
    			 },
    			 {
      			name: 'font size 4',  
      			icon: '<span style="font-size:14px">14</span>', 
      			title: 'Font Size 4',
 					result:  function result() {
      				return pell.exec('fontSize', '4');
    				}
    			 },
    			 {
      			name: 'font size 5',  
      			icon: '<span style="font-size:16px">16</span>', 
      			title: 'Font Size 5',
 					result:  function result() {
      				return pell.exec('fontSize', '5');
    				}
    			 },    			     			     			  
 //   			'heading1',
  //  			'heading2',
 //   			'paragraph',
//			   'quote',
//    			'olist',
//    			'ulist',
//			   'code',
    			'line',
    			{
      			name: 'link',
      			icon: '<span><img src="../src/images/link.png" style="vertical-align: middle" alt="link" width="16px" height="16px"/></span>',
      			//result: () => {
      			result: function () {
      				
      				// check if password field is shown
						if ( document.getElementById("passwordDiv").offsetParent !== null){
							alert(lang.first_enter_password);//"You must first enter the password...");
							return;
						}
						const url = window.prompt('Enter the link (URL)')
        				// check if url is valid - this does not work for local links:
        				var regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        				if (! regexp.test(url)) {
          				alert("Invalid Link...");
          					return;
        				}								

						// check if text for link is selected:
						if ( (window.getSelection().anchorNode.parentNode.className === 'pell-content')
								&& (window.getSelection().rangeCount > 0)){
									//.getRangeAt(0).endOffset - window.getSelection().getRangeAt(0).startOffset > 0) ) {
          				//window.pell.exec('createLink', url);
          				// display link address as tooltip:
          				window.pell.exec("insertHTML",  "<a href='" + url + "' title='" + url +"'>" + window.getSelection() + "</a>");
						} else {
							// set caret							
							_setCaretToEnd();
							// new line and link address as link text:
          				window.pell.exec("insertHTML",  "<a href='" + url + "' title='" + url +"'><br/>" + url + "</a>");
						}
      			}
    			},
     			 {		 	
     			 	
    			 	// file upload from disk, convert in base64, embed in text as img
      			name: 'Image',  //  style="vertical-align: middle;float:right;margin-left:5%"
      			icon: '<span><img src="../src/images/bild.png" style="vertical-align: middle" alt="img" width="16px" height="16px"/></span>',//
      			//icon: '<span>&#128507;</span>',// Bild +Rahmen: 128444 Berg: &#128507; Sonnenuntergang: 127749
      			title: 'Image',
 					result:  function result() {
 						// check if password field is shown
						if ( document.getElementById("passwordDiv").offsetParent !== null){
							alert(lang.first_enter_password);//"You must first enter the password...");
							return;
						}							
						if ( document.getElementById("importDiv") !== null){
							// close file import
     						document.getElementById("importDiv").outerHTML = "";
						}
						// create div element TODO function for file import and image
						var importDiv = document.createElement('div');
						importDiv.setAttribute('id', 'importDiv');
						importDiv.classList.add('shadowBorder');
						// create input element
						var fileInput = document.createElement("input");
      				fileInput.setAttribute('id', 'inputFileImport');		
     					fileInput.setAttribute("type", "file");
     					fileInput.setAttribute('title', 'browse file system');
						// accept only image files
						fileInput.setAttribute('accept', 'image/*');
      				//fileInput.setAttribute('accept', '.png, .jpg, .PNG, .JPG, .jpeg, .JPEG, .gif, .GIF');
						fileInput.addEventListener('change',  function(e) {								
							var file = e.target.files[0];			
							if (_checkValidImage(file) === true) {
								_insertImage(file);
							}																			
						});      
						// Create and add label for input
						var fileInputLabel = document.createElement("label");
     					fileInputLabel.setAttribute('for', 'inputFileImport');								
      				fileInputLabel.innerHTML = lang.select_image + ":";//'Select an image file:';
      				//fileInputLabel.setAttribute('white-space', 'pre-wrap');
      				importDiv.appendChild(fileInputLabel);
      				importDiv.appendChild( document.createElement('br'));
						
      				// add input file to input div and add input div to body
						importDiv.appendChild(fileInput);
      				document.body.appendChild(importDiv);  
      				document.getElementById("textDiv").parentNode.insertBefore( importDiv, document.getElementById("textDiv") );      

						// scroll the site to the input field:
      				var rect = importDiv.getBoundingClientRect();
     				 	window.scrollTo(rect.left, rect.top); 
      				fileInput.focus();   		
    				}
    			 }, 	    			 
    			 {
      			name: 'undo',  
      			icon: '<span style="font-size:18px">↶</span>', // ANTICLOCKWISE TOP SEMICIRCLE ARROW (U+21B6)
      			title: 'Undo Action',
 					result:  function result() {
      				return pell.exec('undo');
    				}
    			 },
    			 {
      			name: 'redo',
      			icon: '<span style="font-size:18px">↷</span>', // CLOCKWISE TOP SEMICIRCLE ARROW (U+21B7)
      			title: 'Redo Action',
 					result:  function result() {
      				return pell.exec('redo');
    				}
    			 },         			     			     			       			    			 
 			],

  			// classes<Array[string]> (optional)
  			// Choose your custom class names
  			classes: {
    			actionbar: 'pell-actionbar',
    			button: 'pell-button',
    			content: 'pell-content',
//selected: 'pell-button-selected'
  			}
		});
	};
	/** Do required settings for this editor: 
	 *  Prevent inserting images as links (the default HTML 5 drag&drop)
	 */
	var doInitialSettings = function(){		

		// disable the drag and drop function for images as links:
		// images as links are not encrypted!!!		
 		var cols =  document.getElementsByClassName('pell-content');
  		for(var i=0; i<cols.length; i++) {
    		cols[i].ondrop = function(e){_dropHandling(e);};
  		}
  	};
	 
	/** Get the current editor
	*/
	var getEditor = function () {
		return textEditor;
	};
	
	/** Disable the editor: Do not allow to
	 *  insert text until password is processed
	 */	
	var disableEditor = function () {
		// get div element of class pell-content:
 		var cols =     document.getElementsByClassName('pell-content');
  		for(var i=0; i<cols.length; i++) {
    		cols[i].style.backgroundColor =    'lightgray';
    		// set contentEditable:
    		cols[i].contentEditable = "false";
  		}
	};
	
	/** Enable editor
	*/
	var enableEditor = function () {
		// get div element of class pell-content:
 		var cols =     document.getElementsByClassName('pell-content');
  		for(var i=0; i<cols.length; i++) {
  			cols[i].style.backgroundColor =    '#f2f2f2';
    		// set contentEditable:
    		cols[i].contentEditable = "true";
  		}
	 };	 

	/** Get the current content of editor
	 * @return the content as string (HTML)
	 */
	var getContent = function () {
		return textEditor.content.innerHTML;
	};
	/** Set the content of the editor: 
	 @param {String} [contentData] The content as (HTML) string
	 */
	var setContent = function (contentData) {
		textEditor.content.innerHTML = contentData;
	};


  
  
  	return { // make functions public:
  		setEditor: setEditor,
  		getEditor: getEditor,
  		disableEditor: disableEditor,
  		enableEditor: enableEditor,
  		getContent: getContent,
  		setContent: setContent, 
  		doInitialSettings: doInitialSettings 
  	};
})();
