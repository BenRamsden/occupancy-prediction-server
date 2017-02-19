#!/bin/bash

./kill.sh

git pull

./start.sh

#nohup npm start > navigationserver_nohup.log 2>&1&
