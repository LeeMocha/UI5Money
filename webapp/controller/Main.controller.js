sap.ui.define([
    "money/controller/BaseController",
    "sap/ui/model/json/JSONModel"
],
function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("money.controller.Main", {
        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(){
            this._getData();
        },

        onCreate: function(){
            this.navTo("Page", {});
        },

        _getData: function () {

            var oMainModel = this.getOwnerComponent().getModel();

            this._getODataRead(oMainModel, "/Money").done(function(aGetData){

                console.log(aGetData);

                this.setModel(new JSONModel(aGetData), "dataModel")
                
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });
        },

        dateFormatter : function(sValue) {
            console.log(sValue);

            var dateVar = new Date(sValue);

            return dateVar.getFullYear() + "-" + (dateVar.getMonth()+1)+ "-" + dateVar.getDate();
        },

        onMove : function(oEvent){

            var getData = this.getModel("dataModel").getData();
            // getData 까지 하지 않으면 Model 객체만 나옴
            var index = oEvent.getSource().getParent().getParent().getIndex();
            // 클릭한 Event 객체에서 해당 Model 배열의 인덱스를 꺼내오는 과정
            var oRowData = getData[index];

            this.navTo("Page", { Uuid : oRowData.Uuid });

        },

        onDelete : function(oEvent){

            var oMainModel = this.getOwnerComponent().getModel();
            var index = this.byId('table').getSelectedIndex();
            var getData = this.getModel("dataModel").getData();
            var oRowData = getData[index];

            var param = "/Money(guid'" + oRowData.Uuid + "')";
            
            this._getODataDelete(oMainModel, param).done(function(aReturn){

                this._getData();

            }.bind(this)).fail(function(){
                // chk = false;
            }).always(function(){

            });

        }

    });
});
