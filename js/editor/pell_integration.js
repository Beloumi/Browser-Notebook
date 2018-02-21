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

// Execute a document command, see reference:
// https://developer.mozilla.org/en/docs/Web/API/Document/execCommand
//pell.exec(command<string>, value<string>)

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
      			icon: '<span style="background-color:red; font-size:16px">&nbsp;&nbsp;&nbsp;</span>', 
      			title: 'Red Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'red');
    				}
    			 },
    			 {
      			name: 'blue',  
      			icon: '<span style="background-color:blue; font-size:16px">&nbsp;&nbsp;&nbsp;</span>', 
      			title: 'Blue Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'blue');
    				}
    			 },
    			 {
      			name: 'black',  
      			icon: '<span style="background-color:black; font-size:16px">&nbsp;&nbsp;&nbsp;</span>', 
      			title: 'Black Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'black');
    				}
    			 },
    			 {
      			name: 'green',  
      			icon: '<span style="background-color:green; font-size:16px">&nbsp;&nbsp;&nbsp;</span>', 
      			title: 'Green Color',
 					result:  function result() {
      				return pell.exec('foreColor', 'green');
    				}
    			 },
    			 {
      			name: 'gray',  
      			icon: '<span style="background-color:gray; font-size:16px">&nbsp;&nbsp;&nbsp;</span>', 
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
        				if (regexp.test(url)) {
          				//window.pell.exec('createLink', url);
          				// display link address as tooltip:
          				window.pell.exec("insertHTML",  "<a href='" + url + "' title='" + url +"'>" + window.getSelection() + "</a>");
        				} else {
          				alert("Invalid Link...");
        				}
      			}
    			},
    		/*	 { // image from web as link:
      			name: 'Image',  // overwrite image to give a hint
      			icon: '&#128247;',
      			title: 'Image',
 					result:  function result() {
      							var url = window.prompt('Enter the image URL\n '
      							+'Note: Only the link, not the image itself is encrypted!');
      							//console.log("url: " + url);
      							if (url) pell.exec('insertImage', url);
    							}
    			 }, 			 */
    			 /* image from web embed {
      			name: 'Image',  // overwrite image to give a hint
      			icon: '&#128247;',
      			title: 'Image',
					result:  function result() {
      				var url = window.prompt('Enter the image URL\n '
      					+'Note: Image is encrypted and embedded, use cautiously to avoid performance penalties');
      				if (url){ 
      					// create image from url:
      					var img = document.createElement('img');
            			img.src = url;
            			img.crossOrigin="anonymous"; 
            		// Not shown, nicht für Opera:					img.crossOrigin="use-credentials"; 
            		//TODO Web address: download -> canvas -> ...				
						// TODO max. Größe: screen.width				
							// draw canvas from image:
							var canvas = document.createElement("canvas");
  							canvas.width = img.width;
  							canvas.height = img.height;
  							var ctx = canvas.getContext("2d");
  							img.onload = function() {
    							ctx.drawImage(img, 0, 0);
							};
  							//ctx.drawImage(img, 0, 0);
  										
  							// get base64 from canvas:  
  							var dataURL = canvas.toDataURL("image/png");
  							dataURL.replace(/^data:image\/(png|jpg);base64,/, "");		 							
       								
      					// embed in text as image with base64 src: 
      					pell.exec("insertHTML",  "<img src='" + dataURL + "'>");
      				}
    			 }, */
    			 {
    			 	// file upload from disk, convert in base64, embed in text as img
      			name: 'Image',  
      			icon: '<span>&#128507;</span>',// Bild +Rahmen: 128444 Berg: &#128507; Sonnenuntergang: 127749
      			//icon: '&#128507;',// Bild +Rahmen: 128444 Berg: &#128507; Sonnenuntergang: 127749
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
								// TODO check if image is valid:	
								// get extension: var imageExtension = file.name.substring(file.name.lastIndexOf('.'), file.name.length);
	   						var reader = new FileReader();
   							reader.readAsDataURL(file);
   							reader.onload = function () {						
     								// embed image
     								pell.exec("insertHTML",  "<img src='" + reader.result + "'>");
     								// close file import
     								document.getElementById("importDiv").outerHTML = "";
   							};
   							reader.onerror = function (error) {
     								console.log('Error: ', error);
     								alert("Could not load image");
   							};
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
    			content: 'pell-content'
  			}
		});
	};

	var doInitialSettings = function(){
		//  nothing to do
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
