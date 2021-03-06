(function (global) {
    var map,
    geocoder,
    LocationViewModel,
    app = global.app = global.app || {};

    LocationViewModel = kendo.data.ObservableObject.extend({
        _lastMarker: null,
        _isLoading: false,

        address: "",
        isGoogleMapsInitialized: false,
        
        onChooseLocation: function(e) {
            var that = this;
            var chosenPosition = that._lastMarker.position;

            var eventLocation = global.app.eventService.viewModel;
            if (eventLocation.latitude != "" && eventLocation.longitude != "") {
                navigator.notification.alert("You have to create or update an event to choose a location!",
                                             function () {
                                             }, "Location chosing failed", 'OK');

                return;
            }
            else {
                eventLocation.set("latitude", chosenPosition.ob);
                eventLocation.set("longitude", chosenPosition.pb);
                eventLocation.set("isLocationChosen", true);
            
                global.app.application.navigate("#:back");
            }
        },

        onNavigateHome: function () {
            var that = this,
            position;

            that._isLoading = true;
            that.showLoading();
            
            var eventLocation = global.app.eventService.viewModel;
            var userLocation = global.app.profileService.viewModel;
            if (eventLocation.latitude != "" && eventLocation.longitude != "") {
                that.isEventLocation = true;
                position = new google.maps.LatLng(eventLocation.latitude, eventLocation.longitude);
                map.panTo(position);
                that._putMarker(position);

                that._isLoading = false;
                that.hideLoading();
            }
            else if (userLocation.latitude != "" && userLocation.longitude != "") {
                that.isEventLocation = true;
                position = new google.maps.LatLng(userLocation.latitude, userLocation.longitude);
                map.panTo(position);
                that._putMarker(position);

                that._isLoading = false;
                that.hideLoading();
            }
            else {
                that.isEventLocation = false;
                
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        map.panTo(position);
                        that._putMarker(position);

                        that._isLoading = false;
                        that.hideLoading();
                    },
                    function (error) {
                        //default map coordinates
                        position = new google.maps.LatLng(43.459336, -80.462494);
                        map.panTo(position);

                        that._isLoading = false;
                        that.hideLoading();

                        navigator.notification.alert("Unable to determine current location. Cannot connect to GPS satellite.",
                                                     function () {
                                                     }, "Location failed", 'OK');
                    },
                    {
                    timeout: 30000,
                    enableHighAccuracy: true
                });
            }
        },

        onSearchAddress: function () {
            var that = this;

            geocoder.geocode(
                {
                'address': that.get("address")
            },
                function (results, status) {
                    if (status !== google.maps.GeocoderStatus.OK) {
                        navigator.notification.alert("Unable to find address.",
                                                     function () {
                                                     }, "Search failed", 'OK');

                        return;
                    }

                    map.panTo(results[0].geometry.location);
                    that._putMarker(results[0].geometry.location);
                });
        },

        showLoading: function () {
            if (this._isLoading) {
                app.application.showLoading();
            }
        },

        hideLoading: function () {
            app.application.hideLoading();
        },

        _putMarker: function (position) {
            var that = this;

            if (that._lastMarker !== null && that._lastMarker !== undefined) {
                that._lastMarker.setMap(null);
            }

            that._lastMarker = new google.maps.Marker({
                map: map,
                position: position
            });
        }
    });

    app.locationService = {
        initLocation: function () {
            var mapOptions;

            if (typeof google === "undefined") {
                return;
            } 

            app.locationService.viewModel.set("isGoogleMapsInitialized", true);

            mapOptions = {
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_BOTTOM
                },

                mapTypeControl: false,
                streetViewControl: false
            };

            map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            geocoder = new google.maps.Geocoder();
            app.locationService.viewModel.onNavigateHome.apply(app.locationService.viewModel, []);
        },

        show: function () {
            if (!app.locationService.viewModel.get("isGoogleMapsInitialized")) {
                return;
            }

            //show loading mask in case the location is not loaded yet 
            //and the user returns to the same tab
            app.locationService.viewModel.showLoading();

            //resize the map in case the orientation has been changed while showing other tab
            google.maps.event.trigger(map, "resize");
            
            kendo.bind($("#choose-location-btn"), app.locationService.viewModel);
        },

        hide: function () {
            //hide loading mask if user changed the tab as it is only relevant to location tab
            app.locationService.viewModel.hideLoading();
        },

        viewModel: new LocationViewModel()
    };
}
)(window);