/**
 * @fileoverview
 * - Using the 'QRCode for Javascript library'
 * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
 * - this library has no dependencies.
 * 
 * @author davidshimjs
 * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
 * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
 */
var QRCode;

(function () {
    //---------------------------------------------------------------------
    // QRCode for JavaScript
    //
    // Copyright (c) 2009 Kazuhiko Arase
    //
    // URL: http://www.d-project.com/
    //
    // Licensed under the MIT license:
    //   http://www.opensource.org/licenses/mit-license.php
    //
    // The word "QR Code" is registered trademark of 
    // DENSO WAVE INCORPORATED
    //   http://www.denso-wave.com/qrcode/faqpatent-e.html
    //
    //---------------------------------------------------------------------
    function QR8bitByte(data) {
        this.mode = QRMode.MODE_8BIT_BYTE;
        this.data = data;
        this.parsedData = [];

        // Added support for UTF-8
        for (var i = 0, l = this.data.length; i < l; i++) {
            var byteArray = [];
            var code = this.data.charCodeAt(i);

            if (code > 0x10000) {
                byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
                byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
                byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
                byteArray[3] = 0x80 | (code & 0x3F);
            } else if (code > 0x800) {
                byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
                byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
                byteArray[2] = 0x80 | (code & 0x3F);
            } else if (code > 0x80) {
                byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
                byteArray[1] = 0x80 | (code & 0x3F);
            } else {
                byteArray[0] = code;
            }

            this.parsedData.push(byteArray);
        }

        this.parsedData = Array.prototype.concat.apply([], this.parsedData);

        if (this.parsedData.length != this.data.length) {
            this.parsedData.unshift(191);
            this.parsedData.unshift(187);
            this.parsedData.unshift(239);
        }
    }

    QR8bitByte.prototype = {
        getLength: function (buffer) {
            return this.parsedData.length;
        },
        write: function (buffer) {
            for (var i = 0, l = this.parsedData.length; i < l; i++) {
                buffer.put(this.parsedData[i], 8);
            }
        }
    };

    function QRCode(element, options) {
        this._htOption = {
            width: 256,
            height: 256,
            typeNumber: 4,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRErrorCorrectLevel.H
        };

        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        if (typeof options === 'string') {
            options = {
                text: options
            };
        }

        if (options) {
            for (var i in options) {
                this._htOption[i] = options[i];
            }
        }

        this._oQRCode = null;
        this._htOption.text = options.text || element.getAttribute("data-url");
        this._el = element;
        this._oQRCode = new QRCodeModel(_getTypeNumber(this._htOption.text, this._htOption.correctLevel), this._htOption.correctLevel);
        this._oQRCode.addData(this._htOption.text);
        this._oQRCode.make();

        this._el.innerHTML = "";
        this._makeImage();
    }

    QRCode.prototype._makeImage = function () {
        var _elCanvas = document.createElement("canvas");
        _elCanvas.width = this._htOption.width;
        _elCanvas.height = this._htOption.height;
        var _oContext = _elCanvas.getContext("2d");
        var _oQRCode = this._oQRCode;
        var _htOption = this._htOption;
        var _nCount = _oQRCode.getModuleCount();
        var _nWidth = _htOption.width / _nCount;
        var _nHeight = _htOption.height / _nCount;
        var _nRoundedWidth = Math.round(_nWidth);
        var _nRoundedHeight = Math.round(_nHeight);

        _oContext.strokeStyle = _htOption.colorLight;
        _oContext.fillStyle = _htOption.colorLight;
        _oContext.fillRect(0, 0, _htOption.width, _htOption.height);

        _oContext.fillStyle = _htOption.colorDark;

        for (var row = 0; row < _nCount; row++) {
            for (var col = 0; col < _nCount; col++) {
                var nLeft = col * _nWidth;
                var nTop = row * _nHeight;
                _oContext.fillStyle = _oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight;
                _oContext.fillRect(nLeft, nTop, _nRoundedWidth, _nRoundedHeight);
            }
        }

        this._el.appendChild(_elCanvas);
    };

    QRCode.CorrectLevel = QRErrorCorrectLevel;
})(); 