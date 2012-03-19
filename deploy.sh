#!/bin/sh

# Deploy to where?
DIR=/opt/www/snooze

# Move the previous deployment to a backup
rm -rf $DIR.prev
mv $DIR $DIR.prev

mkdir -p $DIR
git archive HEAD | tar xf - -C $DIR

# Create a deployment description file
VERS=`git describe --always`
DATE=`git log -n 1 --pretty=format:%ai`
echo "SNOOZE_VERSION='$VERS';" > $DIR/deploydata.js
echo "SNOOZE_DATE='$DATE';" >> $DIR/deploydata.js

# Update cache manifest so the app is reloaded
echo >> $DIR/cache.manifest
echo "# Version: $VERS" >> $DIR/cache.manifest
echo "# Date: $DATE" >> $DIR/cache.manifest

