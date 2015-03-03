module.exports = /*@ngInject*/(hotkeysProvider) => {
    hotkeysProvider.templateTitle = 'Keyboard shortcuts';
    hotkeysProvider.template =  '<div class="cfp-hotkeys-container fade" ng-class="{in: helpVisible}" style="display: none;"><div class="cfp-hotkeys">' +
                                    '<h4 class="cfp-hotkeys-title">{{ title }}</h4>' +
                                    '<dl ng-repeat="hotkey in hotkeys | filter:{ description: \'!$$undefined$$\' }">' +
                                        '<dt class="cfp-hotkeys-keys">' +
                                        '<span ng-repeat="key in hotkey.combo track by $index" class="cfp-hotkeys-key label label-default">{{ key }}</span>' +
                                        '</dt>' +
                                        '<dd class="cfp-hotkeys-text">{{ hotkey.description }}</dd>' +
                                    '</dl>' +
                                    '<div class="cfp-hotkeys-close" ng-click="toggleCheatSheet()">×</div>' +
                                '</div></div>';
    hotkeysProvider.cheatSheetDescription = 'Show/Hide Keyboard Shortcuts';
};