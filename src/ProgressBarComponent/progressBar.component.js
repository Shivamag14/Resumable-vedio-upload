import react, { Fragment } from "react";

const ProgressBar = (props) => {
  const { bgcolor, completed, uploadedMB, totalMB, msg } = props;

  const fillerStyles = {
    height: "100%",
    width: `${completed}%`,
    textAlign: "right",
    transition: "width 1s ease-in-out 0s",
    borderRadius: "4px",
    background:
      "-webkit-gradient( linear, left top, left bottom, from(#a50aad), color-stop(0.50, #6b0d6b), to(#4a074a))",
  };
  return (
    <Fragment>
      {msg && <span className="uploading-msg">{msg}</span>}
      <div className="progress-container">
        <div style={fillerStyles}></div>
        {!!completed && (
          <span className="progress-text">{`${completed}% - ${uploadedMB}/${totalMB}MB`}</span>
        )}
      </div>
    </Fragment>
  );
};

export default ProgressBar;
