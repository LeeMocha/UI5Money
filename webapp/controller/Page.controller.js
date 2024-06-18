sap.ui.define([
    "money/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter"
],
function (Controller, JSONModel, Filter) {
    "use strict";

    return Controller.extend("money.controller.Page", {
        onInit: function () {
            this.getRouter().getRoute("Page").attachMatched(this._onRouteMatched, this);
        },

        onCreate: function(){
            
        },

        _onRouteMatched: function (oEvent){
            
            var oArgs = oEvent.getParameter("arguments");
            this.Uuid = oArgs.Uuid;

            this._setModel();

        },

        _setModel: function(){

            var oBundle = this.getResourceBundle();
            var msg;

            var flag;

            this.setModel(
                new JSONModel([{ Key : "I", Text : "수입" },
                                { Key : "O", Text : "지출" }]), "selectModel"
            );
            
            if(this.Uuid){
                this._getData();
                flag = false;
                msg = oBundle.getText("edit")
            }else {
                this.setModel(
                    new JSONModel({
                        Title : undefined,
                        Type : "O",
                        Content : undefined,
                        Amount : 0
                    }),"viewModel"
                );
                flag = true;
                msg = oBundle.getText("save")
            }
            
            this.setModel(
                new JSONModel({ editable : flag, buttonText : msg }), "pageModel"
            );

            this.editFlag = flag;

        },

        onSave: function () {

            if(this.editFlag) {

                var oMainModel = this.getOwnerComponent().getModel();
                var getData = this.getModel("viewModel").getData();
                
                // getData['Unit'] = 'KRW';
                
                if(this.Uuid){ // 업데이트
                    var param = "/Money(guid'" + this.Uuid + "')";
                    // Entity 에서 해당 레코드에 접근 할 수 있게 해주는 쿼리스트링
                    // Money(guid'5daefeff-bb86-1edf-88c8-6c9e001f00aa') => 해당 값은 Service URL 에서 확인 가능함
                    console.log(getData)
                    this._getODataUpdate(oMainModel, param, getData).done(function(aReturn){
                    // 해당 _getODataUpdate 메서드는 BaseController에 정의된 메서드
        
                    this.navTo("Main", {});

                    }.bind(this)).fail(function(){
                        // chk = false;
                    }).always(function(){
        
                    });
                } else { // 신규
                    this._getODataCreate(oMainModel, "/Money", getData).done(function(aReturn){  
                    
                        console.log(getData);
                        
                        this.navTo("Main", {});
                        
                    }.bind(this)).fail(function(){
                        // chk = false;
                    }).always(function(){
                        
                    });
                }
            } else {

                var oBundle = this.getResourceBundle();
                var msg = oBundle.getText('save');

                this.setModel(
                    new JSONModel({ editable : true, buttonText : msg }), "pageModel"
                );

                this.editFlag = true;

            }
        },

        _getData : function (){

            var oMainModel = this.getOwnerComponent().getModel();
            var aFilter = [];
            aFilter.push(new Filter("Uuid", "EQ", this.Uuid));

            this._getODataRead(oMainModel, "/Money", aFilter).done(function(aGetData){

                console.log(aGetData);

                this.setModel(new JSONModel(aGetData[0]), "viewModel");
                
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });
        }

    });
});
