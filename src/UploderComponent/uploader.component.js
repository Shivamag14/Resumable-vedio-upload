import react, { PureComponent, Fragment } from "react";
import ProgressBar from "../ProgressBarComponent/progressBar.component";
import "./uploader.component.css";
import io from "socket.io-client";

export class FileUploaderComponent extends PureComponent {
  constructor(props) {
    super(props);
    this.fReader = null;
    this.socket = null;
    this.selectedFile = null;
    this.state = {
      name: "",
      uploadCompleted: 0,
      total: 0,
      loaded: 0,
      uploadInProgress: false,
      canUpload: true,
      canPause: false,
      canResume: false,
      uploadPercent: 0,
      isPauseState: false,
      isResumeState: false,
      uploadMsg: "",
    };
  }

  componentDidMount() {
    this.socket = io("http://localhost:5000");
    this.socket.on("MoreData", (data) => {
      this.setState({
        uploadCompleted: parseInt(data["percent"]),
        loaded: data["loaded"],
        lastStartingRange: data["startingRange"],
      });
      let startingRange = data["startingRange"] * 50000; //The Next Blocks Starting Position
      let newFile; //The Variable that will hold the new Block of data
      newFile = this.selectedFile.slice(
        startingRange,
        startingRange + Math.min(50000, this.selectedFile.size - startingRange)
      );

      if (!this.state.isPauseState) {
        this.fReader.readAsBinaryString(newFile);
      }
    });
    this.socket.on("Done", (data) => {
      this.setState(
        {
          uploadCompleted: 100,
          loaded: data["loaded"],
          canUpload: false,
          canPause: false,
          canResume: false,
          isResumeState: false,
          isPauseState: false,
          uploadInProgress: false,
        },
        () => {
          console.log("File uploaded successfully");
          this.setState(
            {
              uploadMsg: `${this.selectedFile.name} File uploaded successfully`,
            },
            () => {
              this.selectedFile = null;
              this.fReader = null;
            }
          );
        }
      );
    });
  }

  onFileSelect = (event) => {
    // Update the state
    this.selectedFile = event.target.files[0];
    this.setState({
      selectedFile: event.target.files[0],
      name: event.target.files[0].name,
      total: event.target.files[0].size,
      loaded: 0,
      uploadCompleted: 0,
      canUpload: true,
      canPause: false,
      canResume: false,
      isPauseState: false,
      isResumeState: false
    });
  };

  resumableUpload = () => {
    this.setState(
      {
        canPause: true,
        canResume: false,
        canUpload: false,
        uploadMsg: "Uploading In Progress.......",
        uploadInProgress: true,
      },
      () => {
        this.fReader = new FileReader();
        this.fReader.onload = (evnt) => {
          if (!this.state.isPauseState) {
            this.socket.emit("Upload", {
              fileName: this.state.name,
              data: evnt.target.result,
            });
          }
        };
        this.socket.emit("Start", {
          fileName: this.state.name,
          size: this.selectedFile.size,
        });
      }
    );
  };

  renderFileDetails = (selectedFile) => {
    return (
      <div className="details-wrapper">
        <div className="flex">
          <label htmlFor="name"> Selected File: </label>
          <input type="text" id="NameBox" value={selectedFile.name} />
          <span className="format">
            {`.${selectedFile.type.split("/")[1]}`}
          </span>
        </div>
        <div className="flex">
          <label htmlFor="size"> File Size: </label>
          <input
            type="text"
            id="size"
            value={parseInt(selectedFile.size / (1024 * 1024))}
          />
          <span className="format"> MB </span>
        </div>
      </div>
    );
  };

  pauseStream = () => {
    this.setState({
      isPauseState: true,
      isResumeState: false,
      canUpload: false,
      canPause: false,
      canResume: true,
      uploadMsg: `Uploading is Paused at ${this.state.uploadCompleted}%`,
    });
  };

  resumeStream = () => {
    this.setState(
      {
        isPauseState: false,
        isResumeState: true,
        canUpload: false,
        canPause: true,
        canResume: false,
        uploadMsg: "Uploading In Progress.......",
      },
      () => {
        this.socket.emit("Resume", {
          startingRange: this.state.lastStartingRange,
          percent: this.state.uploadCompleted,
          loaded: this.state.loaded,
        });
      }
    );
  };

  render() {
    const {
      uploadCompleted,
      uploadInProgress,
      total,
      loaded,
      uploadMsg,
    } = this.state;
    return (
      <Fragment>
        <div className="UploadBox">
          <h2> Video Uploader </h2>
          <span className="UploadArea">
            {!uploadInProgress && (
              <Fragment>
                <input
                  type="file"
                  name="myFile"
                  id="myFile"
                  className="inputfile"
                  onChange={this.onFileSelect}
                  accept="video/*"
                />
                <label htmlFor="myFile"> Choose a File </label>
              </Fragment>
            )}
            {this.selectedFile && this.renderFileDetails(this.selectedFile)}
            {this.selectedFile && this.state.canUpload && (
              <button
                type="button"
                id="UploadButton"
                className="Button"
                onClick={this.resumableUpload}
              >
                Upload
              </button>
            )}
            {this.state.canPause && (
              <button
                type="button"
                id="PauseButton"
                className="Button"
                onClick={this.pauseStream}
              >
                Pause
              </button>
            )}
            {this.state.canResume && (
              <button
                type="button"
                id="ResumeButton"
                className="Button resume-button"
                onClick={this.resumeStream}
              >
                Resume
              </button>
            )}
          </span>
          {uploadCompleted === 100 && (
            <strong><span className="uploading-msg">{uploadMsg}</span></strong>
          )}
          {uploadInProgress && (
            <ProgressBar
              bgcolor={"#6a1b9a"}
              completed={uploadCompleted}
              uploadedMB={parseInt(loaded / (1024 * 1024))}
              totalMB={parseInt(total / (1024 * 1024))}
              msg={uploadMsg}
            />
          )}
        </div>
      </Fragment>
    );
  }
}
