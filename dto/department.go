package dto

type CreateDepartmentRequest struct {
	OrganizationId int    `json:"organization_id"`
	ParentId       int    `json:"parent_id"`
	Name           string `json:"name"`
	Code           string `json:"code"`
	Description    string `json:"description"`
	Sort           *int   `json:"sort"`
	Status         *int   `json:"status"`
}

type UpdateDepartmentRequest struct {
	Id             int    `json:"id"`
	OrganizationId int    `json:"organization_id"`
	ParentId       *int   `json:"parent_id"`
	Name           string `json:"name"`
	Code           string `json:"code"`
	Description    string `json:"description"`
	Sort           *int   `json:"sort"`
	Status         *int   `json:"status"`
}

type DepartmentUserRequest struct {
	UserIds []int `json:"user_ids"`
}
