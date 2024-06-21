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

            convertYearMonthToDate: function (yearMonth) {
                var year = parseInt(yearMonth.substring(0, 4), 10);
                var month = parseInt(yearMonth.substring(4, 6), 10) - 1; // JavaScript Date 객체의 월은 0부터 시작하므로 -1 해줍니다.
                return new Date(year, month);
            },

            _onRouteMatched: function (oEvent) {

                var oArgs = oEvent.getParameter("arguments");
                this.Uuid = oArgs.Uuid;

                this._setModel();

            },

            _setModel: function () {

                var oBundle = this.getResourceBundle();
                var msg;

                var flag;

                this.setModel(
                    new JSONModel([{ Key: "I", Text: "수입" },
                    { Key: "O", Text: "지출" }]), "selectModel"
                );

                if (this.Uuid) {
                    this._getData();
                    flag = false;
                    msg = oBundle.getText("edit")
                } else {

                    var dateVar = new Date();
                    var monthVar = dateVar.getMonth() + 1;

                    if (monthVar < 10) {
                        monthVar = "0" + monthVar
                    }
                    var Yearmonth = dateVar.getFullYear() + "" + monthVar;

                    this.setModel(
                        new JSONModel({
                            dateVar: dateVar,
                            Yearmonth: Yearmonth
                        }), "headModel"
                    );

                    this.setModel(new JSONModel([]), "itemModel");

                    flag = true;
                    msg = oBundle.getText("save")
                }

                this.setModel(
                    new JSONModel({ editable: flag, buttonText: msg }), "pageModel"
                );

                this.editFlag = flag;

            },

            handleChange: function (oEvent) {
                var newValue = oEvent.getParameter("newValue");
                this.setProperty("headModel", "Yearmonth", newValue)
            },

            onSave: function () {

                if (this.editFlag) {

                    var oMainModel = this.getOwnerComponent().getModel();
                    var headData = this.getModel("headModel").getData();
                    var itemData = this.getModel("itemModel").getData();

                    delete headData.dateVar;

                    // getData['Unit'] = 'KRW';

                    if (this.Uuid) { // 업데이트
                        console.log('업데이트');
                        delete headData.to_Item;
                        // Entity 에서 해당 레코드에 접근 할 수 있게 해주는 쿼리스트링
                        // Money(guid'5daefeff-bb86-1edf-88c8-6c9e001f00aa') => 해당 값은 Service URL 에서 확인 가능함
                        // Head의 metadata에서 URI를 추출
                        var headUri = headData.__metadata.uri;

                        // OData Update를 위한 경로 설정
                        var param = headUri.substring(headUri.indexOf("/Head(")); // "/Head(guid'...')"

                        console.log(itemData)
                        console.log(param)

                        // 전체 비동기 작업을 담을 배열
                        let promises = [];

                        // itemData.map 내에서 각 작업을 promises 배열에 추가
                        itemData.map(item => {
                            if (item.Uuid) {
                                // 기존 Head에 기존 Item의 수정
                                var itemUri = item.__metadata.uri.substring(item.__metadata.uri.indexOf("/Item("));
                                let updatePromise = this._getODataUpdate(oMainModel, itemUri, item);
                                promises.push(updatePromise);
                            } else {
                                // 기존 Head에 신규 생성된 Item 들
                                item.Parantsuuid = headData.Uuid;
                                var createUri = param + "/to_Item";
                                let createPromise = this._getODataCreate(oMainModel, createUri, item);
                                promises.push(createPromise);
                            }
                        });

                        // 모델에서 삭제된 데이터 데이터베이스에 반영
                        if (this.deSelectedItem && this.deSelectedItem.length > 0) {
                            this.deSelectedItem.map(item => {
                                console.log(item);
                                var itemUri = item.__metadata.uri.substring(item.__metadata.uri.indexOf("/Item("));
                                let deletePromise = this._getODataDelete(oMainModel, itemUri).done(function (aReturn) {

                                }.bind(this)).fail(() => {
                                    MessageBox.information("Delete Fail");
                                }).always(() => {
                                    this.deSelectedItem = [];
                                });
                                promises.push(deletePromise);
                            });
                        }

                        // 모든 비동기 작업이 완료된 후에 마지막 업데이트 요청 보내기
                        Promise.all(promises).then(() => {
                            return this._getODataUpdate(oMainModel, param, headData);
                        }).then(function (aReturn) {
                            // 최종 업데이트 후 처리
                            this.navTo("Main", {});
                        }.bind(this)).catch(function (err) {
                            // 에러 처리
                            console.error("Error in processing", err);
                        });

                        // itemData.map(item => {
                        //     if (item.Uuid) {
                        //         // 기존 Head에 기존 Item의 수정
                        //         var itemUri = item.__metadata.uri.substring(item.__metadata.uri.indexOf("/Item("));
                        //         this._getODataUpdate(oMainModel, itemUri, item).done(function (aReturn) {
                        //         }.bind(this)).fail(function (err) {
                        //         }).always(function () {
                        //         });
                        //     } else {
                        //         // 기존 Head에 신규 생성된 Item 들
                        //         item.Parantsuuid = headData.Uuid;
                        //         var createUri = param + "/to_Item";
                        //         this._getODataCreate(oMainModel, createUri, item).done(function (aReturn) {
                        //         }.bind(this)).fail(function (err) {
                        //         }).always(function () {
                        //         });
                        //     }
                        // })

                        // // 모델에서 삭제된 데이터 데이터베이스에 반영
                        // if(this.deSelectedItem && this.deSelectedItem.length > 0){
                        //     this.deSelectedItem.map( item => {
                        //         console.log(item)
                        //         var itemUri = item.__metadata.uri.substring(item.__metadata.uri.indexOf("/Item("));
                        //         this._getODataDelete(oMainModel, itemUri).done(function (aReturn) {
            
                        //         }.bind(this)).fail(() => {
                        //             MessageBox.information("Delete Fail");
                        //         }).always(() => {
                        //             this.deSelectedItem = [];
                        //         })
                        //     })
                        // }

                        // this._getODataUpdate(oMainModel, param, headData).done(function (aReturn) {
                        //     // 해당 _getODataUpdate 메서드는 BaseController에 정의된 메서드

                        // }.bind(this)).fail(function () {
                        //     // chk = false;
                        // }).always(() => {
                        // });
                        
                        // this.navTo("Main", {});

                    } else { // 신규
                        console.log('신규');

                        var parantsuuid;
                        var preUrl = "/Head";
                        var headData;

                        let createPromises = [];

                        // 첫 번째 작업: _getODataRead
                        this._getODataRead(oMainModel, "/Head")
                            .done(function (aGetData) {
                                console.log(aGetData);

                                aGetData.map(data => {
                                    if (data.Yearmonth === headData.Yearmonth) {
                                        headData = data;
                                        parantsuuid = data.Uuid;
                                        preUrl += "(guid'" + data.Uuid + "')/to_Item";
                                    }
                                });
                            }.bind(this))
                            .fail(function () {
                                console.error('Failed to read data');
                            }.bind(this))
                            .always(function () {
                                // 두 번째 작업: _getODataCreate (두 가지 분기)

                                if (parantsuuid) {
                                    itemData.map(item => {
                                        item.Parantsuuid = parantsuuid;
                                        let promise1 = this._getODataCreate(oMainModel, preUrl, item).done(function(){
                                            
                                        }.bind(this)).fail(function (err) {
                                            console.error('Failed to create item', err);
                                        });
                                        createPromises.push(promise1)
                                    });
                                } else {
                                    headData.to_Item = itemData;
                                    let promise2 = this._getODataCreate(oMainModel, preUrl, headData)
                                        .fail(function (err) {
                                            console.error('Failed to create head with items', err);
                                        });
                                    createPromises.push(promise2)
                                }

                                // 세 번째 작업: navTo
                                Promise.all(createPromises)
                                    .then(function () {
                                        this.navTo("Main", {});
                                    }.bind(this))
                                    .catch(function (err) {
                                        console.error('Failed to complete creation', err);
                                    });
                            }.bind(this));
                        // headData.to_Item = itemData;
                        // this._getODataCreate(oMainModel, "/Head", headData).done(function(aReturn){  

                        //     console.log(headData);

                        //     this.navTo("Main", {});

                        // }.bind(this)).fail(function(){
                        //     // chk = false;
                        // }).always(function(){

                        // });
                    }
                } else {

                    var oBundle = this.getResourceBundle();
                    var msg = oBundle.getText('save');

                    this.setModel(
                        new JSONModel({ editable: true, buttonText: msg }), "pageModel"
                    );

                    this.editFlag = true;

                }
            },

            _getData: function () {

                var oMainModel = this.getOwnerComponent().getModel();
                var aFilter = [];
                aFilter.push(new Filter("Uuid", "EQ", this.Uuid));

                this._getODataRead(oMainModel, '/Head', aFilter, '$expand=to_Item').done(function (aGetData) {
                    var year = parseInt(aGetData[0].Yearmonth.substring(0, 4), 10);
                    var month = parseInt(aGetData[0].Yearmonth.substring(4, 6), 10) - 1;

                    console.log(aGetData[0]);
                    console.log(aGetData[0].to_Item.results)

                    this.setModel(new JSONModel({ ...aGetData[0], dateVar: new Date(year, month) }), "headModel");
                    this.setModel(new JSONModel(aGetData[0].to_Item.results), "itemModel");

                }.bind(this)).fail(function () {
                    MessageBox.information("Read Fail");
                }).always(function () {

                });
            },

            onCreate: function () {

                let itemJson = {
                    Title: undefined,
                    Type: "O",
                    Content: undefined,
                    Amount: 0,
                    Unit: 'KRW'
                };

                var getData = this.getModel("itemModel").getData();

                getData.push(itemJson);
                this.setModel(new JSONModel(getData), "itemModel");

            },

            onDelete: function () {
                var oTable = this.byId("itemTable"); // 테이블 ID로 테이블을 찾습니다.
                var aSelectedIndices = oTable.getSelectedIndices(); // 선택된 인덱스를 가져옵니다.
                var aSelectedItems = [];

                aSelectedIndices.forEach(function (index) {
                    var oContext = oTable.getContextByIndex(index);
                    var oData = oContext.getObject();
                    aSelectedItems.push(oData);
                });

                // Uuid가 없는 경우 선택된 항목들을 모델에서 삭제
                var getData = this.getModel("itemModel").getData();
                var deSelectedItem = [];
                aSelectedIndices.sort((a, b) => b - a); // 인덱스를 내림차순으로 정렬
                aSelectedIndices.forEach(function (index) {
                    deSelectedItem.push(getData[index]);
                    getData.splice(index, 1); // 모델 데이터 배열에서 선택된 인덱스를 삭제
                });
                this.getModel("itemModel").setData(getData); // 변경된 데이터를 모델에 다시 설정

                this.deSelectedItem = deSelectedItem;

            }

        });
    });
