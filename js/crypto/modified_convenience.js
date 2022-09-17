/** Values used by Browser Notebook: 
 * store salt and key to avoid key derivation for each save action, 
 * set Scrypt iteration count (parameter N)
*/
"use strict";
var BrowserNotebookSettings = {
	storedKey:undefined, // the stored key from previous decryption process
	storedSalt:undefined, // the stored salt from previous decryption process
	keyStored:false, // true if key was stored
	pswChange:false, // true if encryption is called because of password change
	scryptIter:16384 // N parameter, iteration and memory for Scrypt key derivation
};

/** @fileOverview Convenince functions centered around JSON encapsulation.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 *
 * modified for Scrypt as key derivation and default key size 256 by Axel von dem Bruch
 */

 /**
  * JSON encapsulation
  * @namespace
  */
 sjcl.json = {
  /** Default values for encryption */
  //======================================> modification: ks to 256, ts to 128
  // !!!! these values (not the current ones) are used to create the JSON object
  defaults: { v:1, iter:16384, ks:256, ts:128, mode:"ccm", adata:"", cipher:"aes" },

  /** Simple encryption function.
   * @param {String|bitArray} password The password or key.
   * @param {String} plaintext The data to encrypt.
   * @param {Object} [params] The parameters including tag, iv and salt.
   * @param {Object} [rp] A returned version with filled-in parameters.
   * @return {Object} The cipher raw data.
   * @throws {sjcl.exception.invalid} if a parameter is invalid.
   */
  _encryptWithScryptAndAES256: function (password, plaintext, params, rp) {
  	
    params = params || {};
    rp = rp || {};

    var j = sjcl.json, p = j._add({ iv: sjcl.random.randomWords(4,0) },
                                  j.defaults), tmp, prp, adata;
                                  
	if (rp.adata) {
		//console.log("rp adata: " +rp.adata);
		p.adata = rp.adata;
		sjcl.json.defaults.adata = rp.adata;
	}
	if (rp.iter) {
  		//console.log("rp iter: " +rp.iter);
  		//sjcl.json.defaults.iter = rp.iter;
  		p.iter = rp.iter;
  		sjcl.json.defaults.iter = rp.iter;
  	}

    j._add(p, params);
    adata = p.adata;
    if (typeof p.salt === "string") {
      p.salt = sjcl.codec.base64.toBits(p.salt);
    }
    if (typeof p.iv === "string") {
      p.iv = sjcl.codec.base64.toBits(p.iv);
    }

    if (!sjcl.mode[p.mode] ||
        !sjcl.cipher[p.cipher] ||
        (typeof password === "string" && p.iter <= 100) ||	// iterations for key derivation
        (p.ts !== 64 && p.ts !== 96 && p.ts !== 128) ||		// tag size for authentication
        (p.ks !== 128 && p.ks !== 192 && p.ks !== 256) ||	// key size for encryption
        (p.iv.length < 2 || p.iv.length > 4)) {
      throw new sjcl.exception.invalid("json encrypt: invalid parameters");
    }
//=========================================> modification case 1
    if (password === null && BrowserNotebookSettings.pswChange === false) { // use storedKey
    	// use stored values
		password = BrowserNotebookSettings.storedKey;
		p.salt = BrowserNotebookSettings.storedSalt;
    } else if (typeof password === "string") {
//======================================> modification: PBKDF2 to Scrypt
		if(BrowserNotebookSettings.pswChange === false) {
			console.log("_encrypt: Invalid parameter for pswChange: must be true");
			return null;
		} 
//=================		

    	tmp = sjcl.misc.cachedScrypt(password, p);
      //tmp = sjcl.misc.cachedPbkdf2(password, p);
      password = tmp.key.slice(0, p.ks/32);
     	p.salt = tmp.salt;
//=========================> modification: store values
      // store values:
    	BrowserNotebookSettings.storedKey = password;
 		BrowserNotebookSettings.storedSalt = tmp.salt;
 		BrowserNotebookSettings.keyStored = true;

    } else if (sjcl.ecc && password instanceof sjcl.ecc.elGamal.publicKey) {
      tmp = password.kem();
      p.kemtag = tmp.tag;
      password = tmp.key.slice(0,p.ks/32);
    }
     
    if (typeof plaintext === "string") {
      plaintext = sjcl.codec.utf8String.toBits(plaintext);
    }
    if (typeof adata === "string") {
      p.adata = adata = sjcl.codec.utf8String.toBits(adata);
    }
    prp = new sjcl.cipher[p.cipher](password);

    /* return the json data */
    j._add(rp, p);
    rp.key = password;

    /* do the encryption */
    if (p.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && plaintext instanceof ArrayBuffer) {
      p.ct = sjcl.arrayBuffer.ccm.encrypt(prp, plaintext, p.iv, adata, p.ts);
    } else {
      p.ct = sjcl.mode[p.mode].encrypt(prp, plaintext, p.iv, adata, p.ts);
    }
    //==========================> modification: indicator to change psw (additional to password === null))

    //return j.encode(j._subtract(p, j.defaults));
    return p;
  },

  /** Simple encryption function.
   * @param {String|bitArray} password The password or key.
   * @param {String} plaintext The data to encrypt.
   * @param {Object} [params] The parameters including tag, iv and salt.
   * @param {Object} [rp] A returned version with filled-in parameters.
   * @return {String} The ciphertext serialized data.
   * @throws {sjcl.exception.invalid} if a parameter is invalid.
   */
  encryptWithScryptAndAES256: function (password, plaintext, pswChangeArg, params, rp) {
//==========================> modification: indicator to change psw (additional to password === null))
  	BrowserNotebookSettings.pswChange = pswChangeArg;
    var j = sjcl.json, p = j._encryptWithScryptAndAES256.apply(j, arguments);
    return j.encode(p);
  },

  /** Simple decryption function.
   * @param {String|bitArray} password The password or key.
   * @param {Object} ciphertext The cipher raw data to decrypt.
   * @param {Object} [params] Additional non-default parameters.
   * @param {Object} [rp] A returned object with filled parameters.
   * @return {String} The plaintext.
   * @throws {sjcl.exception.invalid} if a parameter is invalid.
   * @throws {sjcl.exception.corrupt} if the ciphertext is corrupt.
   */
  _decryptWithScryptAndAES256: function (password, ciphertext, params, rp) {
    params = params || {};
    rp = rp || {};

    var j = sjcl.json, p = j._add(j._add(j._add({},j.defaults),ciphertext), params, true), ct, tmp, prp, adata=p.adata;
    if (typeof p.salt === "string") {
      p.salt = sjcl.codec.base64.toBits(p.salt);
    }
    if (typeof p.iv === "string") {
      p.iv = sjcl.codec.base64.toBits(p.iv);
    }

    if (!sjcl.mode[p.mode] ||
        !sjcl.cipher[p.cipher] ||
        (typeof password === "string" && p.iter <= 100) ||	// iterations
        (p.ts !== 64 && p.ts !== 96 && p.ts !== 128) ||		// tag size for authentication
        (p.ks !== 128 && p.ks !== 192 && p.ks !== 256) ||	// key size
        (!p.iv) ||
        (p.iv.length < 2 || p.iv.length > 4)) {
      throw new sjcl.exception.invalid("json decrypt: invalid parameters");
    }

    if (typeof password === "string") {
//==============================> modification: set default iterations    	
		// set default values for iteration to parameters of last decrypted file	
		BrowserNotebookSettings.scryptIter = p.iter;
		sjcl.json.defaults.iter = BrowserNotebookSettings.scryptIter;    	
		
		//set as default in menu of notes
		//showDefaultScryptIteration (scryptIter);
    	
    	tmp = sjcl.misc.cachedScrypt(password, p);
      //tmp = sjcl.misc.cachedPbkdf2(password, p);
      password = tmp.key.slice(0,p.ks/32);
      p.salt  = tmp.salt;
//==============================> modification: store values
		// store values:
 		BrowserNotebookSettings.storedKey = password;
 		BrowserNotebookSettings.storedSalt = tmp.salt;
 		BrowserNotebookSettings.keyStored = true;

    } else if (sjcl.ecc && password instanceof sjcl.ecc.elGamal.secretKey) {
      password = password.unkem(sjcl.codec.base64.toBits(p.kemtag)).slice(0,p.ks/32);
    }
    if (typeof adata === "string") {
      adata = sjcl.codec.utf8String.toBits(adata);
    }
    prp = new sjcl.cipher[p.cipher](password);

    /* do the decryption */
    if (p.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && p.ct instanceof ArrayBuffer) {
      ct = sjcl.arrayBuffer.ccm.decrypt(prp, p.ct, p.iv, p.tag, adata, p.ts);
    } else {
      ct = sjcl.mode[p.mode].decrypt(prp, p.ct, p.iv, adata, p.ts);
    }

    /* return the json data */
    j._add(rp, p);
    rp.key = password;

    if (params.raw === 1) {
      return ct;
    } else {
      return sjcl.codec.utf8String.fromBits(ct);
    }
  },

  /** Simple decryption function.
   * @param {String|bitArray} password The password or key.
   * @param {String} ciphertext The ciphertext to decrypt.
   * @param {Object} [params] Additional non-default parameters.
   * @param {Object} [rp] A returned object with filled parameters.
   * @return {String} The plaintext.
   * @throws {sjcl.exception.invalid} if a parameter is invalid.
   * @throws {sjcl.exception.corrupt} if the ciphertext is corrupt.
   */
  decryptWithScryptAndAES256: function (password, ciphertext, params, rp) {	
    var j = sjcl.json;
    return j._decryptWithScryptAndAES256(password, j.decode(ciphertext), params, rp);
  },

  /** Encode a flat structure into a JSON string.
   * @param {Object} obj The structure to encode.
   * @return {String} A JSON string.
   * @throws {sjcl.exception.invalid} if obj has a non-alphanumeric property.
   * @throws {sjcl.exception.bug} if a parameter has an unsupported type.
   */
  encode: function (obj) {
    var i, out='{', comma='';
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (!i.match(/^[a-z0-9]+$/i)) {
          throw new sjcl.exception.invalid("json encode: invalid property name");
        }
        out += comma + '"' + i + '":';
        comma = ',';

        switch (typeof obj[i]) {
          case 'number':
          case 'boolean':
            out += obj[i];
            break;

          case 'string':
            out += '"' + escape(obj[i]) + '"';
            break;

          case 'object':
            out += '"' + sjcl.codec.base64.fromBits(obj[i],0) + '"';
            break;

          default:
            throw new sjcl.exception.bug("json encode: unsupported type");
        }
      }
    }
    return out+'}';
  },

  /** Decode a simple (flat) JSON string into a structure.  The ciphertext,
   * adata, salt and iv will be base64-decoded.
   * @param {String} str The string.
   * @return {Object} The decoded structure.
   * @throws {sjcl.exception.invalid} if str isn't (simple) JSON.
   */
  decode: function (str) {
    str = str.replace(/\s/g,'');
    if (!str.match(/^\{.*\}$/)) {
      throw new sjcl.exception.invalid("json decode: this isn't json!");
    }
    var a = str.replace(/^\{|\}$/g, '').split(/,/), out={}, i, m;
    for (i=0; i<a.length; i++) {
      if (!(m=a[i].match(/^\s*(?:(["']?)([a-z][a-z0-9]*)\1)\s*:\s*(?:(-?\d+)|"([a-z0-9+\/%*_.@=\-]*)"|(true|false))$/i))) {
        throw new sjcl.exception.invalid("json decode: this isn't json!");
      }
      if (m[3] != null) {
        out[m[2]] = parseInt(m[3],10);
      } else if (m[4] != null) {
        out[m[2]] = m[2].match(/^(ct|adata|salt|iv)$/) ? sjcl.codec.base64.toBits(m[4]) : unescape(m[4]);
      } else if (m[5] != null) {
        out[m[2]] = m[5] === 'true';
      }
    }
    return out;
  },

  /** Insert all elements of src into target, modifying and returning target.
   * @param {Object} target The object to be modified.
   * @param {Object} src The object to pull data from.
   * @param {boolean} [requireSame=false] If true, throw an exception if any field of target differs from corresponding field of src.
   * @return {Object} target.
   * @private
   */
  _add: function (target, src, requireSame) {
    if (target === undefined) { target = {}; }
    if (src === undefined) { return target; }
    var i;
    for (i in src) {
      if (src.hasOwnProperty(i)) {
        if (requireSame && target[i] !== undefined && target[i] !== src[i]) {
          throw new sjcl.exception.invalid("required parameter overridden");
        }
        target[i] = src[i];
      }
    }
    return target;
  },

  /** Remove all elements of minus from plus.  Does not modify plus.
   * @private
   */
  _subtract: function (plus, minus) {
    var out = {}, i;

    for (i in plus) {
      if (plus.hasOwnProperty(i) && plus[i] !== minus[i]) {
        out[i] = plus[i];
      }
    }

    return out;
  },

  /** Return only the specified elements of src.
   * @private
   */
  _filter: function (src, filter) {
    var out = {}, i;
    for (i=0; i<filter.length; i++) {
      if (src[filter[i]] !== undefined) {
        out[filter[i]] = src[filter[i]];
      }
    }
    return out;
  }
};

/** Simple encryption function; convenient shorthand for sjcl.json.encrypt.
 * @param {String|bitArray} password The password or key.
 * @param {String} plaintext The data to encrypt.
 * @param {Object} [params] The parameters including tag, iv and salt.
 * @param {Object} [rp] A returned version with filled-in parameters.
 * @return {String} The ciphertext.
 */
sjcl.encryptWithScryptAndAES256 = sjcl.json.encryptWithScryptAndAES256;

/** Simple decryption function; convenient shorthand for sjcl.json.decrypt.
 * @param {String|bitArray} password The password or key.
 * @param {String} ciphertext The ciphertext to decrypt.
 * @param {Object} [params] Additional non-default parameters.
 * @param {Object} [rp] A returned object with filled parameters.
 * @return {String} The plaintext.
 */
sjcl.decryptWithScryptAndAES256 = sjcl.json.decryptWithScryptAndAES256;

/** The cache for cachedScrypt.
 * @private
 */
sjcl.misc._scryptCache = {};

/** Cached Scrypt key derivation.
 * @param {String} password The password.
 * @param {Object} [obj] The derivation params (iteration count and optional salt).
 * @return {Object} The derived data in key, the salt in salt.
 */
sjcl.misc.cachedScrypt = function (password, obj) {
  var cache = sjcl.misc._scryptCache, c, cp, str, salt, iter;

  obj = obj || {};
  iter = obj.iter || BrowserNotebookSettings.scryptIter;

  /* open the cache for this password and iteration count */
  cp = cache[password] = cache[password] || {};
  c = cp[iter] = cp[iter] || { firstSalt: (obj.salt && obj.salt.length) ?
                     obj.salt.slice(0) : sjcl.random.randomWords(2,0) };
  salt = (obj.salt === undefined) ? c.firstSalt : obj.salt;

 //======================================> modification: PBKDF2 to Scrypt
 // iteration, memory 8. parallel 1, length of key in Bit!!!: 256
  	c[salt] = c[salt] || sjcl.misc.scrypt(password, salt, iter, 8, 1, 256);
  	//c[salt] = c[salt] || sjcl.misc.scrypt(password, salt, obj.iter, 8, 1, 256);
  return { key: c[salt].slice(0), salt:salt.slice(0) };
};
