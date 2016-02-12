define(["app", "marionette", "backbone",  "core/basicModel", "core/view.base", "underscore"],
    function (app, Marionette, Backbone, ModelBase, ViewBase, _){

        app.module("request-logs", function (module){

            var View = ViewBase.extend({
                tagName: "li",
                template: "debug",

                initialize: function (){
                    _.bindAll(this, "renderReport", "onReportRender");
                },

                events: {
                    "click #renderCommand": "renderReport"
                },

                linkToTemplateView: function (view){
                    this.templateView = view;
                    this.templateView.beforeRenderListeners.add(this.onReportRender);
                },

                onReportRender: function (request, cb){
                    if (this.processingReport) {
                        request.options.debug = { logsToResponse: true };
                    }
                    this.processingReport = false;

                    cb();
                },

                renderReport: function (){
                    this.processingReport = true;
                    this.templateView.preview();
                }
            });

            app.on("toolbar-render", function (context){
                if (context.name === "template-detail") {
                    var view = new View({model: context.model});
                    view.linkToTemplateView(context.view);
                    context.region.show(view, "debug");
                }
            });
        });
    });
