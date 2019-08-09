'use strict';

import React from "react";

import FrontView from 'teaset/components/Overlay/TopView';
// import FrontView from './FrontView';//如果没有引入teaset，请使用这条语句
import ConsoleBtn from './ConsoleBtn';
import ConsolePanel from './ConsolePanel';

export default class LogView {

  static FloatButton = ConsoleBtn;
  static PanelView = ConsolePanel;

  static show(overlayView) {
    let key;
    let onDisappearCompletedSave = overlayView.props.onDisappearCompleted;
    let element = React.cloneElement(overlayView, {
      onDisappearCompleted: () => {
        FrontView.remove(key);
        onDisappearCompletedSave && onDisappearCompletedSave();
      }
    });
    key = FrontView.add(element);
    return key;
  }

  static hide(key) {
    FrontView.remove(key);
  }

  static transformRoot(transform, animated, animatesOnly = null) {
    FrontView.transform(transform, animated, animatesOnly);
  }

  static restoreRoot(animated, animatesOnly = null) {
    FrontView.restore(animated, animatesOnly);
  }

}
