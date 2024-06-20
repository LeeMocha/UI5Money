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

            this._getODataRead(oMainModel, "/Head").done(function(aGetData){

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
            var oTable = this.byId("headTable"); // 테이블 ID로 테이블을 찾습니다.
            var oMainModel = this.getOwnerComponent().getModel();
            var aSelectedIndices = oTable.getSelectedIndices(); // 선택된 인덱스를 가져옵니다.
            var aSelectedItems = [];

            aSelectedIndices.forEach(function(index) {
                var oContext = oTable.getContextByIndex(index);
                var oData = oContext.getObject();
                aSelectedItems.push(oData);
            });

            aSelectedItems.map(item => {
                var itemUri = item.__metadata.uri.substring(item.__metadata.uri.indexOf("/Head("));
                this._getODataDelete(oMainModel, itemUri).done(function(aReturn){

                }.bind(this)).fail(()=>{
                    MessageBox.information("Delete Fail");
                }).always(()=>{

                })
            })
            this._getData();
        }

    });
});
