/*
 HtmlQ v1.0.3
 (c) 2014-2015 aproxima Gesellschaft für Markt- und Sozialforschung Weimar http://github.com/aproxima/htmlq
 License: MIT
*/

function xml2json(xml) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(xml);
    return json;
};

function transformTextToHtml($sce, text, parseHtml) {
    if (parseHtml) {
        text = text.replace(/{br}/g, '<br>');
        text = text.replace(/\{/g, '<').replace(/\}/g, '>')
    }
    return $sce.trustAsHtml(text);
}

function getOrderedStatementsFromGrid(sortedStatements) {
    var ret = [];
    for (var i = 0; i < sortedStatements.grid.length; i++) {
        for (var j = 0; j < sortedStatements.grid[i].length; j++) {
            if (sortedStatements.grid[i][j].statement) {
                ret.push(sortedStatements.grid[i][j].statement);
            }
        }
    }
    ret.sort(function(a, b) {
        return parseInt(a._id, 10) - parseInt(b._id, 10);
    });
    return ret;
};

function getRatingForStatement(map, statement, sortedStatements) {
    for (var i = 0; i < sortedStatements.grid.length; i++) {
        for (var j = 0; j < sortedStatements.grid[i].length; j++) {
            if (sortedStatements.grid[i][j].statement._id === statement._id) {
                return map.column[i]._id;
            }
        }
    }
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffleInPlace(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {};
    return o;
};

angular.module('app', ['ui.router', 'ui.bootstrap'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('error', {
            template: '<div class="container"><div class="row" style="margin-top: 35px;"><div class="col-xs-8 col-xs-offset-2 alert alert-danger"><p>An error occured while opening your survey. If you tried to open index.html via the file:// protocol, please use Firefox or another browser that allows XML HTTP Requests to local files.</p></div></div></div>'
        })
        .state('root', {
            'abstract': true,
            controller: 'RootCtrl',
            templateUrl: 'templates/root.html',
            resolve: {
                'language': ['$http', '$sce', function($http, $sce) {
                    return $http.get('settings/language.xml', {
                        transformResponse: xml2json
                    }).then(function(data, status) {
                        var parseHtml = data.data.language._htmlParse === 'true';
                        var items = jsonPath.eval(data, '$.data.language.item')[0];
                        var ret = {};
                        for (var i = 0; i < items.length; i++) {
                            ret[items[i]._id] = transformTextToHtml($sce, items[i].__text, parseHtml);
                        }

                        ret.backButton = ret.backButton || $sce.trustAsHtml('Back');
                        ret.fillInRequiredFields = ret.fillInRequiredFields || $sce.trustAsHtml('Please fill in all required fields.');

                        return ret;
                    });
                }],
                'statements': ['$http', '$sce', function($http, $sce) {
                    return $http.get('settings/statements.xml', {
                        transformResponse: xml2json
                    }).then(function(data, status) {
                        var parseHtml = data.data.statements._htmlParse === 'true';
                        return _.map(data.data.statements.statement, function(statement) {
                            return {
                                _id: statement._id,
                                __text: transformTextToHtml($sce, statement.__text, parseHtml)
                            }
                        });
                    });
                }],
                'map': ['$http', function($http) {
                    return $http.get('settings/map.xml', {
                        transformResponse: xml2json
                    }).then(function(data, status) {
                        return data.data.map;
                    });
                }],
                'config': ['$http', function($http) {
                    return $http.get('settings/config.xml', {
                        transformResponse: xml2json
                    }).then(function(data, status) {
                        var items = jsonPath.eval(data, '$.data.config.item')[0];
                        var ret = {};
                        for (var i = 0; i < items.length; i++) {
                            ret[items[i]._id] = items[i].__text;
                        }
                        ret['_version'] = data.data.config._version;
                        return ret;
                    });
                }],
                'configXml': ['$http', function($http) {
                    return $http.get('settings/config.xml')
                        .then(function(data, status) {
                            return data.data;
                        });
                }]
            }
        })
        .state('root.welcome', {
            url: '/?userCode',
            templateUrl: 'templates/empty.html',
            controller: 'WelcomeCtrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.welcomeHead;
                }],
                message: ['language', function(language) {
                    return language.welcomeText;
                }],
                'userCodeParam': ['$stateParams', function($stateParams) {
                    return $stateParams.userCode;
                }]
            },
            next: 'root.login',
            warnOnClose: false
        })
        .state('root.login', {
            url: '/login',
            templateUrl: 'templates/login.html',
            controller: 'LoginCtrl',
            next: 'root.introduction',
            warnOnClose: false
        })
        .state('root.introduction', {
            url: '/introduction',
            templateUrl: 'templates/empty.html',
            controller: 'MessageCtrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.introHead;
                }],
                message: ['language', function(language) {
                    return language.introText;
                }]
            },
            next: 'root.step1',
            warnOnClose: true
        })
        .state('root.step1', { // 3 columns
            url: '/step1',
            templateUrl: 'templates/step1.html',
            controller: 'Step1Ctrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.step1Head;
                }],
                message: ['language', function(language) {
                    return language.step1Text;
                }]
            },
            hasHelp: true,
            warnOnClose: true
        })
        .state('root.step2', { // +- grid
            url: '/step2',
            templateUrl: 'templates/step2.html',
            controller: 'Step2Ctrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.step2Head;
                }],
                message: ['language', function(language) {
                    return language.step2Text;
                }]
            },
            hasHelp: true,
            noBackButton: true,
            warnOnClose: true
        })
        .state('root.step3', { // reorder grid
            url: '/step3',
            templateUrl: 'templates/step3.html',
            controller: 'Step3Ctrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.step3Head;
                }],
                message: ['language', function(language) {
                    return language.step3Text;
                }]
            },
            hasHelp: true,
            warnOnClose: true
        })
        .state('root.step4', { // comments for best and worst rating
            url: '/step4',
            templateUrl: 'templates/step4.html',
            controller: 'Step4Ctrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.step4Head;
                }],
                message: ['language', function(language) {
                    return language.step4Text;
                }]
            },
            hasHelp: true,
            warnOnClose: true
        })
        .state('root.step5', { // demographics or questionnaire
            url: '/step5',
            templateUrl: 'templates/step5.html',
            controller: 'Step5Ctrl',
            resolve: {
                messageHead: ['language', function(language) {
                    return language.step5Head;
                }],
                message: ['language', function(language) {
                    return language.step5Text;
                }]
            },
            hasHelp: true,
            warnOnClose: true
        })
        .state('root.submit', { // demographics or questionnaire
            url: '/submit?retry',
            templateUrl: 'templates/submit.html',
            controller: 'SubmitCtrl',
            warnOnClose: true
        })
        .state('root.print', { // demographics or questionnaire
            url: '/print',
            templateUrl: 'templates/print.html',
            controller: 'PrintCtrl',
            warnOnClose: true
        })
        .state('root.thanks', { // demographics or questionnaire
            url: '/thanks',
            templateUrl: 'templates/thanks.html',
            controller: 'ThanksCtrl',
            warnOnClose: false
        });
    $urlRouterProvider.otherwise('/');
}])

.controller('RootCtrl', ['language', 'statements', 'map', 'config', 'configXml', 'SortedStatements', 'Survey', 'Duration', '$sce', '$scope', '$state', '$log', function(language, statements, map, config, configXml, SortedStatements, Survey, Duration, $sce, $scope, $state, $log) {
    $scope.language = language;
    $scope.statements = statements;
    $scope.map = map;
    $scope.config = config;
    $scope.configXml = configXml;
    $scope.duration = Duration;

    var longestColumn = _.last(_.sortBy(map.column, function(column){ return parseInt(column.__text, 10); }));
    $scope.cellHeight = 300 / parseInt(longestColumn.__text, 10);

    $scope.textAlignRight = (config.textAlign === 'right');

    // initialize sorted statements
    $scope.sortedStatements = SortedStatements;
    $scope.sortedStatements.list = statements.slice();
    if (config['shuffleCards'] === 'true') {
        shuffleInPlace($scope.sortedStatements.list);
    }

    // initialize grid
    var columnsLength = $scope.map.column.length;
    $scope.sortedStatements.grid = Array(columnsLength);
    for (var i = 0; i < columnsLength; i++) {
        var colDesc = $scope.map.column[i];
        var cellsLength = parseInt(colDesc.__text, 10);
        $scope.sortedStatements.grid[i] = Array(cellsLength);
        for (var j = 0; j < cellsLength; j++) {
            $scope.sortedStatements.grid[i][j] = {
                statement: null
            };
        }
    }

    // initialize survey
    var doc = $.parseXML(configXml);
    var form = null;
    var items = doc.documentElement.childNodes;
    for (var i = 0; i < items.length; i++) {
        if (items[i].attributes && items[i].attributes.getNamedItem('id') && items[i].attributes.getNamedItem('id').value === 'form') {
            form = items[i];
            break;
        }
    }

    $scope.survey = Survey;
    $scope.survey.formElements = [];

    if (form !== null) {
        var formElements = form.childNodes;

        for (var i = 0; i < formElements.length; i++) {
            var el = {}
            if (formElements[i].nodeName === 'label') {
                el.type = 'label';
                el.text = $sce.trustAsHtml(formElements[i].firstChild.nodeValue);
            } else if (formElements[i].nodeName === 'note') {
                el.type = 'note';
                el.text = $sce.trustAsHtml(formElements[i].firstChild.nodeValue);
            } else if (formElements[i].nodeName === 'input') {
                el.type = 'input';
                el.inputType = formElements[i].attributes.getNamedItem('type').value;
                el.scale = formElements[i].attributes.getNamedItem('scale') ? formElements[i].attributes.getNamedItem('scale').value.split(';') : [];
                el.required = (formElements[i].attributes.getNamedItem('required') && formElements[i].attributes.getNamedItem('required').value.toLowerCase() === 'true');
                el.maxLength = (formElements[i].attributes.getNamedItem('maxlength') && formElements[i].attributes.getNamedItem('maxlength').value);
                el.restricted = (formElements[i].attributes.getNamedItem('restricted') && formElements[i].attributes.getNamedItem('restricted').value && formElements[i].attributes.getNamedItem('restricted').value.length > 0);
                if (formElements[i].firstChild && formElements[i].firstChild.nodeValue) {
                    el.options = formElements[i].firstChild.nodeValue.split(';');
                }
                if (el.inputType === 'checkbox' || el.inputType.indexOf('rating') === 0) {
                    el.value = Array(el.options.length);
                }
            } else {
                continue;
            }
            el.bg = (formElements[i].attributes.getNamedItem('bg') && formElements[i].attributes.getNamedItem('bg').value === 'true')
            $scope.survey.formElements.push(el);
        }
    }

    $scope.help = function() {
        // broadcast
        $scope.$broadcast('help');
    };

    $scope.next = function() {
        // broadcast
        $scope.$broadcast('next');
    };

    $scope.progressStyle = function() {
        return '' + Math.round($scope.progress() * 100) + '%';
    }

    $scope.progress = function() {
        var total = 0;
        var current = 0;

        var inGrid = [];
        for (var i = 0; i < $scope.sortedStatements.grid.length; i++) {
            for (var j = 0; j < $scope.sortedStatements.grid[i].length; j++) {
                if ($scope.sortedStatements.grid[i][j].statement) {
                    inGrid.push($scope.sortedStatements.grid[i][j].statement);
                }
            }
        }

        total += statements.length * 2; // each statement has to be categorized (step1) and rated (step2)

        var allStatements = inGrid.concat($scope.sortedStatements.agree, $scope.sortedStatements.neutral, $scope.sortedStatements.disagree);
        for (var i = 0; i < allStatements.length; i++) {
            if (allStatements[i]) {
                if (allStatements[i].category) {
                    current++;
                }
            }
        }

        // stementents in grid are rated
        for (var i = 0; i < inGrid.length; i++) {
            if (inGrid[i]) {
                current++;
            }
        }

        // card comments
        if (config.showStep4 === 'true') {
            total += parseInt(map.column[0].__text, 10);
            total += parseInt(map.column[map.column.length - 1].__text, 10);

            for (var i = 0; i < $scope.sortedStatements.grid[0].length; i++) {
                var statement = $scope.sortedStatements.grid[0][i].statement;
                if (statement && statement.comment && statement.comment.length > 0) {
                    current++;
                }
            }

            for (var i = 0; i < $scope.sortedStatements.grid[$scope.sortedStatements.grid.length - 1].length; i++) {
                var statement = $scope.sortedStatements.grid[$scope.sortedStatements.grid.length - 1][i].statement;
                if (statement && statement.comment && statement.comment.length > 0) {
                    current++;
                }
            }
        }

        // mandatory input fields
        if (config.showStep5 === 'true') {
            for (var i = 0; i < $scope.survey.formElements.length; i++) {
                if ($scope.survey.formElements[i].required) {
                    if ($scope.survey.formElements[i].inputType === 'checkbox') {
                        if (_.some($scope.survey.formElements[i].value)) {
                            current++;
                        }
                    } else if ($scope.survey.formElements[i].value && $scope.survey.formElements[i].value.length) {
                        current++;
                    }
                    total++;
                }
            }
        }

        return current / total;
    };

    $scope.hasHelp = function() {
        return $state.current.hasHelp;
    };

    $scope.canGoBack = function() {
        return !$state.current.noBackButton;
    };

    window.onbeforeunload = function() {
        if ($state.current.warnOnClose == true) {
            return language.leaveSiteWarning || '';
        } else {
            return undefined;
        }
    };
}])

.controller('MessageCtrl', ['message', 'messageHead', 'MessageModal', 'language', 'config', '$scope', '$state', function(message, messageHead, MessageModal, language, config, $scope, $state) {
    var modal = MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);

    modal.result.then(function() {
        $state.go($state.current.next);
    });
}])

.controller('WelcomeCtrl', ['message', 'messageHead', 'MessageModal', 'UserCode', 'userCodeParam', 'language', 'config', '$scope', '$state', function(message, messageHead, MessageModal, UserCode, userCodeParam, language, config, $scope, $state) {
    var modal = MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);

    if (userCodeParam && userCodeParam.length > 0) {
        UserCode.userCode = userCodeParam;
    }

    modal.result.then(function() {
        // skip login if it's not active
        if (!config.loginrequired || config.loginrequired === 'false') {
            $state.go('root.introduction');
        } else {
            $state.go('root.login');
        }
    });
}])

.factory('SortedStatements', [function() {
    return {
        list: [],
        disagree: [],
        neutral: [],
        agree: [],
        grid: null
    };
}])

.factory('Survey', [function() {
    return {
        formElements: [],
        formElementToString: function(formElement) {
            if (formElement.inputType === 'checkbox') {
                var ret = [];
                for (var i = 0; i < formElement.value.length; i++) {
                    ret.push(formElement.value[i] ? '1' : '0');
                }
                return ret.join('|');
            } else if (formElement.inputType.indexOf('rating') === 0) {
                return formElement.value.join('|');
            } else {
                return formElement.value;
            }
        }
    };
}])

.factory('Duration', [function() {
    return [0, 0, 0, 0, 0];
}])

.factory('UserCode', [function() {
    return {
        userCode: null
    };
}])

.directive('trackDuration', ['$interval', function($interval) {
    return {
        restrict: 'A',
        scope: {
            model: '=trackDuration'
        },
        link: function(scope, element, attrs) {
            element.on('$destroy', function() {
                $interval.cancel(timeoutId);
            });
            var timeoutId = $interval(function() {
                scope.model += 0.1;
            }, 100);
        }
    };
}])

.directive('droppable', ['$log', function($log) {
    return {
        restrict: 'A',
        scope: {
            model: '=droppableModel',
            onDroppableReceive: '&',
            droppableCategory: '@',
            afterDrop: '&'
        },
        link: function(scope, element, attrs) {
            $(element).droppable({
                hoverClass: 'active',
                tolerance: 'pointer',
                drop: function(event, ui) {
                    var dragElement = angular.element(ui.draggable.get()).isolateScope();
                    scope.$apply(function() {
                        scope.onDroppableReceive({$statement: dragElement.statement()});
                        scope.model.unshift(dragElement.statement());
                        scope.afterDrop({$statement: dragElement.statement(), $category: scope.droppableCategory});
                    });
                }
            });
        }
    };
}])


.directive('draggableStatementFirst', [function() {
    return {
        restrict: 'A',
        scope: {
            statement: '&draggableStatementFirst'
        },
        link: function(scope, element, attrs) {
            $(element).draggable({
                opacity: 0.5,
                scroll: false,
                appendTo: '#step1',
                helper: 'clone'
            });
        }
    };
}])

.directive('draggableStatement', [function() {
    return {
        restrict: 'A',
        scope: {
            statement: '&draggableStatement',
            helperWidth: '@',
            cloneOnDrag: '&',
            smallFont: '&'
        },
        link: function(scope, element, attrs) {
            scope.initialStatement = scope.statement();

            var options = {
                scroll: false,
                appendTo: '#step2',
                stack: '.draggable, .swappable',
                revert: function(dropTarget) {
                    if ($(dropTarget).attr('id') === 'step2') return false;
                    if (!$(dropTarget).hasClass('cell')) return true;
                    var statementOnDroppable = angular.element(dropTarget).scope().cell.statement;
                    var isOccupiedByAnotherStatement = (statementOnDroppable && statementOnDroppable._id !== scope.initialStatement._id);
                    return isOccupiedByAnotherStatement;
                },
                cursorAt: { top: 35, left: 50 }
            };

            if (!scope.cloneOnDrag || scope.cloneOnDrag()) {
                options.helper = function(event) {
                    var ret = $(this).clone().addClass('dragging-onto-grid');
                    if (scope.smallFont && scope.smallFont() === 'true') {
                        ret.addClass('small-font')
                    }
                    return ret;
                };
            }

            $(element).draggable(options);
        }
    };
}])

.directive('swappableStatement', ['$log', function($log) {
    return {
        restrict: 'A',
        scope: {
            statement: '&swappableStatement',
            initialCell: '&swappableStatementCell',
            swappable: '@'
        },
        templateUrl: 'templates/_swappable_statement.html',
        link: function(scope, element, attrs) {
            // save initial statement in case the binding changes through dom manipulation
            scope.initialStatement = scope.statement();
            scope.cell = scope.initialCell();

            $(element).draggable({
                stack: '.swappable, .draggable',
                revert: 'invalid',
                start: function(event, ui) {
                    $log.info('DRAG START EVENT');

                    // remember drag start position
                    $(this).prop('startPos', $(this).offset());

                    // DRAG OUT OF CELL
                    scope.$apply(function() {
                        if (scope.cell) {
                            scope.cell.statement = null;
                        }
                    });
                }
            });

            if (scope.swappable === 'false') {
                return;
            }

            $(element).droppable({
                accept: '.swappable',
                greedy: true,
                over: function(event, ui) {
                    ui.draggable.addClass('swap-possible');
                },
                out: function(event, ui) {
                    ui.draggable.removeClass('swap-possible');
                },
                drop: function(event, ui) {
                    // SWAP TWO DRAGGABLES
                    scope.$apply(function() {
                        $log.info('SWAP EVENT');
                        var draggedElement = angular.element(ui.draggable.get()).isolateScope();
                        var self = scope;

                        // put statements into each others' cells
                        if (self.cell) {
                            self.cell.statement = draggedElement.initialStatement;
                        }
                        if (draggedElement.cell) {
                            draggedElement.cell.statement = self.initialStatement;
                        }

                        // swap cell references
                        var tmpCell = self.cell;
                        self.cell = draggedElement.cell;
                        draggedElement.cell = tmpCell;
                    });

                    // remove swap icon
                    ui.draggable.removeClass('swap-possible');

                    // animate both draggables
                    var draggedElementPrevPosition = ui.draggable.prop('startPos');
                    var draggedElementPosition = ui.draggable.offset();
                    var selfPosition = $(element).offset();

                    // animate self to the previous position of the dragged element
                    var dx = draggedElementPrevPosition.left - selfPosition.left;
                    var dy = draggedElementPrevPosition.top - selfPosition.top;
                    $(element).animate({
                        left: '+=' + dx,
                        top: '+=' + dy
                    }).zIndex(5000);

                    // animate dragged element to the position of self
                    var dx2 = selfPosition.left - draggedElementPosition.left;
                    var dy2 = selfPosition.top - draggedElementPosition.top;
                    ui.draggable.animate({
                        left: '+=' + dx2,
                        top: '+=' + dy2
                    }).zIndex(5001);

                    // prevent memory leaks in IE:
                    ui.draggable.removeProp('startPos');
                }
            });
        }
    };
}])

.directive('swappableDroppable', ['$compile', '$log', function($compile, $log) {
    return {
        restrict: 'A',
        scope: {
            initialCell: "&swappableDroppable",
            onReceivedStatementFromCategories: "&",
            dynamicallyCreateInitialStatement: "@",
            helperWidth: '@'
        },
        link: function(scope, element, attrs) {
            scope.cell = scope.initialCell();

            function addStatementDiv(outerScope, reposition) {
                var el = $compile('<div swappable-statement="cell.statement" swappable-statement-cell="cell" swappable="false" class="swappable" ng-class="{textright: textAlignRight}" style="position: relative;"></div>')(outerScope);
                var w = (parseInt(scope.helperWidth, 10) - 8) + 'px';
                $(el).css('width', w);
                $(element).append(el);
                if (reposition) {
                    var targetOffset = $(element).offset();
                    $(el).offset({top: targetOffset.top + 3, left: targetOffset.left + 3});
                }
            }

            // initial statement
            if (scope.dynamicallyCreateInitialStatement === 'true' && scope.cell.statement) {
                addStatementDiv(element.scope());
            }

            $(element).droppable({
                hoverClass: "droppable-active",
                greedy: true,
                drop: function(event, ui) {
                    $log.info('DROP EVENT');
                    // don't accept if we're already occupied
                    if (scope.cell.statement) {
                        $log.info('cancelled');
                        return;
                    }

                    var dragElement = angular.element(ui.draggable.get()).isolateScope();

                    // we're empty, add dragged statement to cell
                    scope.$apply(function() {
                        // set statement in cell
                        scope.cell.statement = dragElement.initialStatement;

                        // set cell reference in dragged element
                        dragElement.cell = scope.cell;
                    });

                    // animate dragged element into position
                    var drop_p = $(this).offset();
                    var drag_p = ui.draggable.offset();
                    var left_end = drop_p.left - drag_p.left + 3;
                    var top_end = drop_p.top - drag_p.top + 3;
                    ui.draggable.animate({
                        top: '+=' + top_end,
                        left: '+=' + left_end
                    });

                    // if the dragged statement was a draggable and not a swappable, add a div that can be dragged around in the grid.
                    if (ui.draggable.attr('draggable-statement')) {
                        scope.$apply(function() {
                            addStatementDiv(element.scope(), true);
                            scope.onReceivedStatementFromCategories({$statement: dragElement.initialStatement});
                        });
                    }

                    // destroy the dragged element if it requests it
                    if (ui.draggable.hasClass('destroy-on-place')) {
                        ui.draggable.remove();
                    }

                }
            });
        }
    };
}])

.directive('droppableBackground', ['$log', '$compile', function($log, $compile) {
    return {
        restrict: 'A',
        scope: {
            onDrop: '&'
        },
        link: function(scope, element, attrs) {
            $(element).droppable({
                drop: function(event, ui) {
                    $log.info('DROP ON BG EVENT');
                    var dragElement = angular.element(ui.draggable.get()).isolateScope();

                    scope.$apply(function() {
                        if (ui.helper.hasClass('dragging-onto-grid')) {
                            if (!dragElement.cloneOnDrag()) return;
                            // we're currently dragging a statement out of the categories onto the canvas
                            // we have to remove the statement from the categories and add a equivalent draggable div to the canvas
                            //ui.helper.clone().appendTo('#step2');
                            var s = scope.$new(true);
                            s.statement = dragElement.initialStatement;
                            var el = $compile('<div draggable-statement="statement" clone-on-drag="false" class="destroy-on-place draggable dragging-onto-grid" ng-class="{neutral: statement.category === \'neutral\', agree: statement.category === \'agree\', disagree: statement.category === \'disagree\', textright: textAlignRight}" style="position: relative;" data-placement="bottom" data-toggle="tooltip" data-trigger="hover click" title="({{ statement._id }}) {{ statement.__text }}"><b>({{statement._id}})</b> {{statement.__text }}</div>')(s);
                            if (dragElement.smallFont && dragElement.smallFont === 'true') {
                                el.addClass('small-font');
                            }
                            $(el).appendTo('#step2');
                            $(el).offset(ui.helper.offset());
                            scope.onDrop({$statement: s.statement});
                        } else {
                            // the statement was already in the grid and is now being dropped on the canvas
                            dragElement.cell = null;
                        }
                    });
                }
            });
        }
    }
}])

.controller('LoginCtrl', ['config', 'language', 'UserCode', '$http', '$scope', '$state', function(config, language, UserCode, $http, $scope, $state) {
    function getParameterByName(queryString, name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(queryString);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function loginViaGet(code) {
        return $http.get(config.loginUrl, {
            params: {uid: code}
        });
    };

    function loginViaPost(code) {
        return $http.post(config.loginUrl, $.param({uid: code}), {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    }

    function loginViaHttp(code) {
        var promise;
        if (config['loginUrlMethod'].toLowerCase() === 'get') {
            promise = loginViaGet(code);
        } else {
            promise = loginViaPost(code);
        }
        return (promise.
            success(function(data, status) {
                // in FireFox, if you open HtmlQ via the file:// protocol and the POST or GET to the default path
                // just returns the source code of the PHP script. In this case we assume failure even though the response is HTTP 200
                if (data.indexOf("<?php") === 0) {
                    $scope.error = language.loginNoConnection;
                    throw '';
                };
            }).
            error(function() {
                $scope.error = language.loginNoConnection;
            }));
    };

    $scope.login = function(code) {
        if (!code || code.length === 0) {
            $scope.error = language.loginNoInput;
            return;
        }

        if (config.loginUrl && config.loginUrl.length > 0) {
            loginViaHttp(code).then(function(response) {
                var status = getParameterByName(response.data, 'status');
                if (parseInt(status, 10) === 1) {
                    $state.go('root.introduction');
                } else {
                    $scope.error = language.loginInvalidInput;
                }
            });
        } else {
            var correctPw = false;
            if (config.loginPassword && config.loginPassword.length > 0) {
                correctPw = (config.loginPassword === code);
            } else {
                correctPw = true;
            }
            if (correctPw) {
                UserCode.userCode = code;
                $state.go('root.introduction');
            } else {
                $scope.error = language.loginInvalidInput;
            }
        }
    }
}])

.controller('Step1Ctrl', ['message', 'messageHead', 'language', 'config', 'SortedStatements', 'MessageModal', '$rootScope', '$scope', '$state', function(message, messageHead, language, config, SortedStatements, MessageModal, $rootScope, $scope, $state) {
    $scope.help = function() {
        MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);
    };
    $scope.$on('help', $scope.help)
    $scope.next = function() {
        $state.go('root.step2');
    };
    $scope.$on('next', $scope.next);

    $scope.sortedStatements = SortedStatements;

    $scope.hasNoCategory = function(statement) {
        return !statement.category;
    }

    $scope.allCards = function() {
        return SortedStatements.list.length + SortedStatements.agree.length + SortedStatements.neutral.length + SortedStatements.disagree.length + getOrderedStatementsFromGrid(SortedStatements).length;
    }

    $scope.sortedCards = function() {
        return SortedStatements.agree.length + SortedStatements.neutral.length + SortedStatements.disagree.length + getOrderedStatementsFromGrid(SortedStatements).length;
    }

    function removeStatementFromArray(arr, statement) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i]._id === statement._id) {
                arr.splice(i, 1);
            }
        }
    }

    $scope.removeFromSortedStatements = function(statement) {
        // remove from all other lists
        removeStatementFromArray(SortedStatements.list, statement);
        removeStatementFromArray(SortedStatements.agree, statement);
        removeStatementFromArray(SortedStatements.disagree, statement);
        removeStatementFromArray(SortedStatements.neutral, statement);
    }

    $scope.afterDrop = function(statement, category) {
        statement.category = category;
        nextIfComplete();
    }

    function isComplete() {
        return $scope.sortedCards() >= $scope.allCards();
    }

    function nextIfComplete() {
        if (isComplete()) {
            $scope.next();
        }
    }

    // if this step is already completed, immediately go to the next step
    // this happens when a user tries to go back to step 1. Don't show help.
    if (!isComplete()) {
        $scope.help();
    }
    nextIfComplete();

    $scope.$on('my:keyup', function(event, keyEvent) {
        var card = $('#statements > div.draggable:first-child');
        var category = null;
        if (keyEvent.keyCode === 49) {
            card.prependTo('ul.sortable.disagree');
            category = 'disagree';
        } else if (keyEvent.keyCode === 50) {
            card.prependTo('ul.sortable.neutral');
            category = 'neutral';
        } else if (keyEvent.keyCode === 51) {
            card.prependTo('ul.sortable.agree');
            category = 'agree';
        } else {
            return;
        }
        var statement = angular.element(card.get()).scope().statement;
        $scope.removeFromSortedStatements(statement);
        SortedStatements[category].unshift(statement);
        $scope.afterDrop(statement, category);
    });
}])

.controller('Step2Ctrl', ['message', 'messageHead', 'language', 'statements', 'map', 'config', 'SortedStatements', 'MessageModal', '$scope', '$rootScope', '$state', function(message, messageHead, language, statements, map, config, SortedStatements, MessageModal, $scope, $rootScope, $state) {
    $scope.help = function() {
        MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);
    };
    $scope.help();
    $scope.$on('help', $scope.help)
    $scope.next = function() {
        $rootScope.goToNextPage(config, 2);
    };
    $scope.$on('next', $scope.next);

    $scope.language = language;

    $scope.map = map;
    for (var i = 0; i < $scope.map.column.length; i++) {
        var col = $scope.map.column[i];
        col.cells = Array(parseInt(col.__text, 10));
    }

    $scope.removeStatement = function(statement) {
        for (var i = 0; i < SortedStatements.agree.length; i++) {
            if (SortedStatements.agree[i]._id === statement._id) {
                SortedStatements.agree.splice(i, 1);
            }
        }

        for (var i = 0; i < SortedStatements.disagree.length; i++) {
            if (SortedStatements.disagree[i]._id === statement._id) {
                SortedStatements.disagree.splice(i, 1);
            }
        }

        for (var i = 0; i < SortedStatements.neutral.length; i++) {
            if (SortedStatements.neutral[i]._id === statement._id) {
                SortedStatements.neutral.splice(i, 1);
            }
        }
    };

    $scope.done = function() {
        var ct = 0;
        for (var i = 0; i < SortedStatements.grid.length; i++) {
            for (var j = 0; j < SortedStatements.grid[i].length; j++) {
                if (SortedStatements.grid[i][j].statement) {
                    ct++
                }
            }
        }
        return ct >= statements.length;
    };
}])

.controller('Step3Ctrl', ['message', 'messageHead', 'language', 'statements', 'map', 'config', 'SortedStatements', 'MessageModal', '$scope', '$rootScope', '$state', function(message, messageHead, language, statements, map, config, SortedStatements, MessageModal, $scope, $rootScope, $state) {
    $scope.help = function() {
        MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);
    };
    $scope.help();
    $scope.$on('help', $scope.help)
    $scope.next = function() {
        $rootScope.goToNextPage(config, 3);
    };
    $scope.$on('next', $scope.next);

    for (var i = 0; i < map.column.length; i++) {
        var col = map.column[i];
        col.cells = Array(parseInt(col.__text, 10));
    }

    $scope.done = function() {
        var ct = 0;
        for (var i = 0; i < SortedStatements.grid.length; i++) {
            for (var j = 0; j < SortedStatements.grid[i].length; j++) {
                if (SortedStatements.grid[i][j].statement) {
                    ct++
                }
            }
        }
        return ct >= statements.length;
    };
}])

.controller('Step4Ctrl', ['message', 'messageHead', 'language', 'statements', 'map', 'config', 'SortedStatements', 'MessageModal', '$scope', '$rootScope', '$state', function(message, messageHead, language, statements, map, config, SortedStatements, MessageModal, $scope, $rootScope, $state) {
    $scope.help = function() {
        MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);
    };
    $scope.help();
    $scope.$on('help', $scope.help)
    $scope.next = function() {
        for (var i = 0; i < $scope.disagreeColumn.length; i++) {
            if (!$scope.disagreeColumn[i].statement.comment) {
                $scope.disagreeColumn[i].statement.comment = ' ';
            }
        }

        for (var i = 0; i < $scope.agreeColumn.length; i++) {
            if (!$scope.agreeColumn[i].statement.comment) {
                $scope.agreeColumn[i].statement.comment = ' ';
            }
        }

        $rootScope.goToNextPage(config, 4);
    };
    $scope.$on('next', $scope.next);

    $scope.disagreeRating = map.column[0]._id;
    $scope.disagreeColor = map.column[0]._colour;
    $scope.disagreeColumn = SortedStatements.grid[0];
    $scope.agreeRating = map.column[map.column.length - 1]._id;
    $scope.agreeColor = map.column[map.column.length - 1]._colour;
    $scope.agreeColumn = SortedStatements.grid[SortedStatements.grid.length - 1];
}])

.controller('Step5Ctrl', ['message', 'messageHead', 'language', 'config', 'configXml', 'MessageModal', 'Survey', '$scope', '$rootScope', '$state', function(message, messageHead, language, config, configXml, MessageModal, Survey, $scope, $rootScope, $state) {
    $scope.help = function() {
        MessageModal.show(messageHead, message, config.textAlign, language.btnContinue);
    };
    $scope.help();
    $scope.$on('help', $scope.help)
    $scope.next = function() {
        if ($scope.isSurveyComplete()) {
            $scope.error = false;
            $rootScope.goToNextPage(config, 5);
        } else {
            makeRequiredEmptySurveyFieldsRed();
            $scope.error = true;
            window.scrollTo(0, 0);
        }
    };
    $scope.$on('next', $scope.next);

    $scope.error = false;

    function makeRequiredEmptySurveyFieldsRed() {
        for (var i = 0; i < Survey.formElements.length; i++) {
            var formElement = Survey.formElements[i];
            if (formElement.required) {
                if (formElement.inputType === 'text' || formElement.inputType === 'textarea') {
                    formElement.red = (!formElement.value || formElement.value.length === 0);
                    if (formElement.restricted && isNaN(formElement.value)) {
                        formElement.red = true;
                    }
                } else if (formElement.inputType === 'checkbox') {
                    formElement.red = !_.some($scope.survey.formElements[i].value);
                } else {
                    formElement.red = !formElement.value;
                }
            }
        }
    }

    $scope.isSurveyComplete = function() {
        for (var i = 0; i < Survey.formElements.length; i++) {
            var formElement = Survey.formElements[i];
            if (formElement.required) {
                if (formElement.inputType === 'text' || formElement.inputType === 'textarea') {
                    if (!formElement.value || formElement.value.length === 0) {
                        return false;
                     }

                    if (formElement.restricted && isNaN(formElement.value)) {
                        return false;
                    }
                } else if (formElement.inputType === 'checkbox') {
                    if (!_.some($scope.survey.formElements[i].value)) {
                        return false;
                    }
                } else {
                    if (!formElement.value) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}])

.controller('SubmitCtrl', ['language', 'config', 'map', 'SortedStatements', 'Survey', 'Duration', 'UserCode', '$http', '$scope', '$state', '$stateParams', '$log', function(language, config, map, SortedStatements, Survey, Duration, UserCode, $http, $scope, $state, $stateParams, $log) {
    function makeSortString(sortedStatements) {
        var sorted = [];
        for (var i = 0; i < sortedStatements.length; i++) {
            var rating = getRatingForStatement(map, sortedStatements[i], SortedStatements);
            sorted.push(rating);
        }
        return sorted;
    }

    function makeParamsObject() {
        var statements = getOrderedStatementsFromGrid(SortedStatements);
        var sorted = makeSortString(statements);
        var ret = {
            dur0: Math.round(Duration[0] + Duration[1] + Duration[2] + Duration[3] + Duration[4]),
            dur1: Math.round(Duration[0]),
            dur2: Math.round(Duration[1]),
            dur3: Math.round(Duration[2]),
            dur4: Math.round(Duration[3]),
            dur5: Math.round(Duration[4]),
            datetime: $.format.date(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            sort: sorted.join('|'),
            name: config['studyTitle'] + ' ' + config['_version'],
            npos: _.filter(statements, function(s) { return s.category === 'agree'; }).length,
            nneu: _.filter(statements, function(s) { return s.category === 'neutral'; }).length,
            nneg: _.filter(statements, function(s) { return s.category === 'disagree'; }).length
        };

        if (UserCode.userCode && UserCode.userCode.length > 0) {
            ret.uid = UserCode.userCode;
        }
        for (var i = 0; i < SortedStatements.grid[0].length; i++) {
            var statement = SortedStatements.grid[0][i].statement;
            ret['comment' + statement._id] = '(s' + statement._id + ') ' + statement.comment;
        }

        for (var i = 0; i < SortedStatements.grid[SortedStatements.grid.length - 1].length; i++) {
            var statement = SortedStatements.grid[SortedStatements.grid.length - 1][i].statement;
            ret['comment' + statement._id] = '(s' + statement._id + ') ' + statement.comment;
        }

        var ct = 0;
        for (var i = 0; i < Survey.formElements.length; i++) {
            if (Survey.formElements[i].type === 'input') {
                ret['form' + ct] = Survey.formElementToString(Survey.formElements[i]);
                ct++;
            }
        }
        return ret;
    }

    function submitViaGet() {
        return $http.get(config['submitUrl'], {
            params: makeParamsObject()
        });
    };

    function submitViaPost() {
        return $http.post(config['submitUrl'], $.param(makeParamsObject()), {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    }

    $scope.submitViaHttp = function() {
        var promise;
        if (config['submitUrlMethod'].toLowerCase() === 'get') {
            promise = submitViaGet();
        } else {
            promise = submitViaPost();
        }
        promise.
            success(function(data, status) {
                // in FireFox, if you open HtmlQ via the file:// protocol and the POST or GET to the default path
                // just returns the source code of the PHP script. In this case we assume failure even though the response is HTTP 200
                if (data.indexOf("<?php") === 0) {
                    $state.go('root.submit', {retry: $stateParams.retry ? parseInt($stateParams.retry, 10) + 1 : 1});
                } else {
                    $state.go('root.thanks');
                }
            }).
            error(function() {
                $state.go('root.submit', {retry: $stateParams.retry ? parseInt($stateParams.retry, 10) + 1 : 1});
            });
    };

    $scope.firstTry = (!$stateParams.retry || $stateParams.retry === 0);
    $scope.mailReceiver = config['submitMail'];
    $scope.mailSubject = 'HtmlQ/' + config['studyTitle'] + ' ' + config['_version'];

    var createMailText = function() {
        var params = makeParamsObject();
        function strFromParam(key) {
            return key + ': ' + (params[key] || '') + '\n';
        };
        function strWithPrefix(prefix) {
            var matchingKeys = keysWithPrefix(prefix);
            matchingKeys.sort();
            var ret = [];
            for (var i = 0; i < matchingKeys.length; i++) {
                ret.push(strFromParam(matchingKeys[i]));
            }
            return ret.join('');
        }
        function keysWithPrefix(prefix) {
            var ret = [];
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    if (key.indexOf(prefix) === 0) {
                        ret.push(key);
                    }
                }
            }
            return ret;
        }
        var ret = language['mailBody'] + '\n\n' +
            strFromParam('uid') + 
            strFromParam('sort') +
            strFromParam('nneg') +
            strFromParam('nneu') +
            strFromParam('npos') +
            strWithPrefix('comment') +
            strWithPrefix('form') +
            strWithPrefix('dur') + '\n' +
            '------------------------------\n' +
            'Mail generated by HtmlQ\n' +
            '------------------------------\n';
        return ret;
    };

    $scope.mailText = createMailText();
}])

.controller('PrintCtrl', ['language', 'config', 'map', 'SortedStatements', 'Survey', 'Duration', 'UserCode', '$timeout', '$scope', '$state', function(language, config, map, SortedStatements, Survey, Duration, UserCode, $timeout, $scope, $state) {
    var statements = getOrderedStatementsFromGrid(SortedStatements);

    $scope.userCode = UserCode;

    $scope.studyTitle = config['studyTitle'];
    $scope.studyVersion = config['_version'];
    $scope.survey = Survey;
    $scope.disagreeColumn = SortedStatements.grid[0];
    $scope.agreeColumn = SortedStatements.grid[SortedStatements.grid.length - 1];

    $scope.negativeLength = _.filter(statements, function(s) { return s.category === 'disagree'; }).length;
    $scope.neutralLength = _.filter(statements, function(s) { return s.category === 'neutral'; }).length;
    $scope.positiveLength = _.filter(statements, function(s) { return s.category === 'agree'; }).length;

    $scope.date = new Date();
    $scope.totalDuration = Math.round(Duration[0] + Duration[1] + Duration[2] + Duration[3] + Duration[4]);

    $scope.isInput = function(formElement) {
        return (formElement.type == 'input');
    };

    $timeout(window.print, 200);
}])

.controller('ThanksCtrl', [function() {
}])

.service('MessageModal', ['$modal', function($modal) {
    return {
        show: function(messageHead, message, textAlign, ok) {
            return modalInstance = $modal.open({
                templateUrl: 'templates/modal.html',
                controller: 'ModalInstanceCtrl',
                backdrop: 'static',
                resolve: {
                    messageHead: [function() {
                        return messageHead;
                    }],
                    message: [function () {
                        return message;
                    }],
                    ok: [function() {
                        return ok;
                    }],
                    textAlign: [function() {
                        return textAlign;
                    }]
                }
            });
        }
    };
}])

.controller('ModalInstanceCtrl', ['$scope', '$modalInstance', 'messageHead', 'message', 'ok', 'textAlign', function ($scope, $modalInstance, messageHead, message, ok, textAlign) {
    $scope.messageHead = messageHead;
    $scope.message = message;
    $scope.okButton = ok;
    $scope.textAlignRight = (textAlign === "right");
    $scope.ok = function () {
        $modalInstance.close();
    };
}])

.filter('escape', [function() {
    return encodeURI;
}])

.run(['$rootScope', '$modalStack', '$log', '$state', function($rootScope, $modalStack, $log, $state) {
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        $log.error("" + error + " occured while navigating to " + toState + " with params: " + toParams);
        $state.go('error');
    });

    $rootScope.goToNextPage = function(config, currentStep) {
        if (currentStep < 3 && config.showStep3 === 'true') {
            $state.go('root.step3');
        } else if (currentStep < 4 && config.showStep4 === 'true') {
            $state.go('root.step4');
        } else if (currentStep < 5 && config.showStep5 === 'true') {
            $state.go('root.step5');
        } else {
            $state.go('root.submit')
        }
    };

    var firstRequest = true;
    $rootScope.$on('$stateChangeStart', function(event) {
        var top = $modalStack.getTop();
        if (top) {
            $modalStack.dismiss(top.key);
        }

        // on first request always go to initial page
        if (firstRequest) {
            firstRequest = false;
            event.preventDefault();
            $state.go('root.welcome');
        }
    });

    $rootScope.debug = false;
}]);
