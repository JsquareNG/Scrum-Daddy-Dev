import React from "react";
import { Card, CardActions, Button } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check"; // Tick icon
import CloseIcon from "@mui/icons-material/Close"; // Cross icon

const IndividualDelegateCard = ({
  record,
  delegatorName,
  changeDelegateStatus,
  employeeDetails,
  user
}) => {

  return (
    <Card sx={{ padding: "0" }} className="my-2 mx-1" variant="outlined">
      <div className=" p-2 px-md-3 text-xs">
        <div className="font-bold">
          <div>
            {`${String(new Date(record.start_date).getDate()).padStart(
              2,
              "0"
            )}/${String(new Date(record.start_date).getMonth() + 1).padStart(
              2,
              "0"
            )}/${new Date(record.start_date).getFullYear()}`}{" "}
            -
            {`${String(new Date(record.end_date).getDate()).padStart(
              2,
              "0"
            )}/${String(new Date(record.end_date).getMonth() + 1).padStart(
              2,
              "0"
            )}/${new Date(record.end_date).getFullYear()}`}
          </div>
        </div>
        <div>Reason: {record.reason}</div>
        <div>From: {employeeDetails[record.delegate_from]?.staff_fname} {employeeDetails[record.delegate_from]?.staff_lname}</div>
        <div>
          To:{" "}
          {record.delegate_to === user.staff_id
            ? "Me"
            : `${employeeDetails[record.delegate_to]?.staff_fname} ${employeeDetails[record.delegate_to]?.staff_lname}`}
        </div>

        <CardActions
          disableSpacing
          sx={{ padding: "0" }}
          className="flex justify-between"
        >
          {record.status !== "accepted" &&
            record.status !== "rejected" &&
            record.delegate_from !== user.staff_id && (
              <>
                <Button
                  size="small"
                  color="success"
                  onClick={() =>
                    changeDelegateStatus(
                      record.delegate_id,
                      record.delegate_from,
                      record.delegate_to,
                      "accepted"
                    )
                  }
                  className="p-0"
                  sx={{ padding: 0 }}
                  startIcon={<CheckIcon />}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() =>
                    changeDelegateStatus(
                      record.delegate_id,
                      record.delegate_from,
                      record.delegate_to,
                      "rejected"
                    )
                  }
                  className="p-0"
                  startIcon={<CloseIcon />}
                />
              </>
            )}
        </CardActions>
      </div>
    </Card>
  );
};

export default IndividualDelegateCard;
