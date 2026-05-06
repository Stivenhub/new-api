package dto

type CreateCustomRoleRequest struct {
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Status      *int   `json:"status"`
}

type UpdateCustomRoleRequest struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Status      *int   `json:"status"`
}

type CustomRoleUserRequest struct {
	UserIds []int `json:"user_ids"`
}

type UserAssociationsRequest struct {
	OrganizationIds []int `json:"organization_ids"`
	DepartmentIds   []int `json:"department_ids"`
	CustomRoleIds   []int `json:"custom_role_ids"`
}

type UserAssociationsResponse struct {
	OrganizationIds []int `json:"organization_ids"`
	DepartmentIds   []int `json:"department_ids"`
	CustomRoleIds   []int `json:"custom_role_ids"`
}
