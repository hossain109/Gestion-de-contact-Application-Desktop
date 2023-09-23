const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 840,
    height: 700,
    resizable: false,
    icon: path.join(__dirname, "image", "contact.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};
//recevoir response sur click button exporter des contact
ipcMain.handle("click-for-exporter", async (event) => {
  const { canceled, filePath } = await dialog.showSaveDialog();
  const jsonpath = fs.readFileSync(path.join(__dirname, "contact.json"));
  const jsondata = JSON.parse(jsonpath);
  let result = "";
  jsondata.map((data) => {
    result += data.nom + " ";
    result += data.prenom + " ,";
    result += data.email + " ,";
    result += data.address.ville + ",";
    result += data.address.code + ",";
    result += data.address.pays;
    result += "\n";
  });

  //console.log(result);
  if (!canceled) {
    fs.writeFile(filePath, result, (error) => {
      if (error) {
        return console.log(error);
      } else {
        console.log("file saved");
      }
    });
  }
});

//recevoir reponse sur click button inserer contact
let secodaryWindow;
ipcMain.handle("click-button", () => {
  secodaryWindow = new BrowserWindow({
    width: 800,
    height: 740,
    modal: true,
    x: 510,
    y: 150,
    resizable: false,
    parent: mainWindow,
    title: "Ajouter Contact",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  secodaryWindow.loadFile(path.join(__dirname, "contact.html"));
  //lorsque contact availabe envoyer une requete a preload
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  afficherJson();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
let jsondata;
let jsonbuffer;
function afficherJson() {
  jsonbuffer = fs.readFileSync(path.join(__dirname, "contact.json"));
  jsondata = jsonbuffer.toString();
  //json data envoyer ver front-end
  mainWindow.webContents.send("json-data", jsondata);
}
//recevoir requete insert-contact a fichier json
ipcMain.handle("insert-contact", (event, contact) => {
  let newData = JSON.stringify(contact);
  let contactData = JSON.parse(newData);
  jsondata = JSON.parse(jsondata);
  jsondata.push(contactData);
  //insert et affichage des json data
  let jsondataString = JSON.stringify(jsondata, null, 3);
  fs.writeFileSync(
    path.join(__dirname, "contact.json"),
    jsondataString,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  secodaryWindow.close();
  //setTimeout({console.log("Contact bien enregistre")},500)
  afficherJson();
});

//recevoir requete pour image et inserer sur dossier image"
/*
ipcMain.handle("send-image", async (event, pathUpload) => {
  const image = nativeImage.createFromPath(pathUpload);
  const bufferImage = image.toDataURL();
  //console.log(bufferImage);
  const __dirImage = path.join(__dirname, "image");
  console.log(bufferImage);
  fs.writeFileSync(__dirImage, bufferImage, (error) => {
    if (error) console.log(error);
    else console.log("image enregistre");
  });
});
*/
//importer fichier
ipcMain.handle("import-fichier", async (e) => {
  //fichier json
  const jsonFile = fs.readFileSync(path.join(__dirname, "contact.json"));
  const jsonFileData = JSON.parse(jsonFile);

  const { canceled, filePaths } = await dialog.showOpenDialog();
  const filePathsString = filePaths.toString();
  // console.log(filePathsString);
  if (!canceled) {
    //fichier à importer
    let importFile = fs.readFileSync(filePathsString);
    let importFileData = JSON.parse(importFile);
    console.log(importFileData);
    importFileData.map((eachObject) => {
      jsonFileData.push(eachObject);
    });
    console.log("whole file " + jsonFileData);
    //insert et affichage des json data
    let jsonImportData = JSON.stringify(jsonFileData, null, 3);
    fs.writeFileSync(
      path.join(__dirname, "contact.json"),
      jsonImportData,
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );
    afficherJson();
  }
});

/**
 * json data first readfile
 * then convert to string
 * then convert json parse
 */
