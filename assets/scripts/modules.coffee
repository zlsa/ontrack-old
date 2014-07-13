
window.prop
    about:
        name: "onTrack"
        version: "0.1"
    
class Module
    constructor: (options) ->
        @filename = options.filename or null
        @loaded = false
        @loading = false
        @library = options.library or false

$ ->
    
